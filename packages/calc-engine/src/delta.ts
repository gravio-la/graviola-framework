import type { JSONSchema7 } from "json-schema";
import type { CompiledProfile } from "@graviola/formula-dependency";
import { planInvalidation } from "@graviola/formula-materialization";
import { definitionNameFromScope } from "@graviola/json-schema-utils";
import type { EntityChangeEvent, Unsubscribe } from "@graviola/store-core";
import uniq from "lodash-es/uniq";
import { evaluateForRoots, type CalcEngineStore } from "./evaluateForRoots";
import { warm, type WarmStore } from "./warm";

export type DirtySlotSet = {
  entityIRI: string;
  typeName: string;
  scopes: string[];
};

/**
 * Invert a binding-path edge: given dirty child IRIs, find parent instances
 * that reference them. Store-specific (SPARQL bidirectional / Prisma relation).
 */
export type AffectedInstancePlanner = {
  findParents: (args: {
    childTypeName: string;
    childIRIs: string[];
    parentTypeName: string;
    edgeProperty: string;
  }) => Promise<string[]>;
};

export type CalcInvalidationHandle = {
  unsubscribe: Unsubscribe;
};

export type RelationEdge = {
  parentTypeName: string;
  childTypeName: string;
  edgeProperty: string;
};

function refTypeName(
  schema: JSONSchema7 | boolean | undefined,
): string | undefined {
  if (!schema || typeof schema === "boolean") return undefined;
  if (typeof schema.$ref === "string") {
    return definitionNameFromScope(schema.$ref) ?? schema.$ref.split("/").pop();
  }
  if (
    schema.type === "array" &&
    schema.items &&
    typeof schema.items === "object"
  ) {
    return refTypeName(schema.items as JSONSchema7);
  }
  return undefined;
}

/**
 * Derive parent→child relation edges from domain schema definitions.
 * Used by the affected-instance climb (one batched upward hop per edge).
 */
export function discoverRelationEdges(
  domainSchema: JSONSchema7,
): RelationEdge[] {
  const defs = domainSchema.definitions ?? {};
  const edges: RelationEdge[] = [];
  for (const [parentTypeName, def] of Object.entries(defs)) {
    if (!def || typeof def === "boolean" || !def.properties) continue;
    for (const [edgeProperty, prop] of Object.entries(def.properties)) {
      const childTypeName = refTypeName(prop as JSONSchema7);
      if (!childTypeName) continue;
      edges.push({ parentTypeName, childTypeName, edgeProperty });
    }
  }
  return edges;
}

/**
 * Find slots whose owning type matches `typeName`, plus transitive dependents
 * via `planInvalidation`. Without prior fingerprint, treat the whole
 * dependent closure as dirty (ESCALATIONS).
 */
export function dirtyScopesForChange(
  profile: CompiledProfile,
  typeName: string,
): string[] {
  const seeds: string[] = [];
  for (const [scope, slot] of Object.entries(profile.slots)) {
    if (definitionNameFromScope(slot.entityScope) === typeName) {
      seeds.push(scope);
    }
  }
  const all = new Set<string>();
  for (const seed of seeds) {
    all.add(seed);
    for (const dep of planInvalidation(profile, seed)) {
      all.add(dep);
    }
  }
  return [...all];
}

/**
 * Climb from dirty child IRIs to root IRIs via inverted relation edges.
 * Query count is bounded by graph depth (one batched findParents per edge hop),
 * not by total store size.
 */
export async function climbAffectedRoots(args: {
  domainSchema: JSONSchema7;
  planner: AffectedInstancePlanner;
  childTypeName: string;
  childIRIs: string[];
  rootTypeName: string;
  maxHops?: number;
}): Promise<{ rootIRIs: string[]; queriesIssued: number }> {
  const {
    domainSchema,
    planner,
    childTypeName,
    childIRIs,
    rootTypeName,
    maxHops = 8,
  } = args;
  const edges = discoverRelationEdges(domainSchema);
  let currentType = childTypeName;
  let currentIRIs = uniq(childIRIs);
  let queriesIssued = 0;

  for (let hop = 0; hop < maxHops; hop++) {
    if (currentType === rootTypeName) {
      return { rootIRIs: currentIRIs, queriesIssued };
    }
    const inbound = edges.filter((e) => e.childTypeName === currentType);
    if (inbound.length === 0) break;

    const next = new Set<string>();
    let nextType: string | undefined;
    for (const edge of inbound) {
      const parents = await planner.findParents({
        childTypeName: currentType,
        childIRIs: currentIRIs,
        parentTypeName: edge.parentTypeName,
        edgeProperty: edge.edgeProperty,
      });
      queriesIssued += 1;
      for (const iri of parents) next.add(iri);
      nextType = edge.parentTypeName;
    }
    if (next.size === 0 || !nextType) break;
    currentType = nextType;
    currentIRIs = [...next];
  }

  return {
    rootIRIs: currentType === rootTypeName ? currentIRIs : [],
    queriesIssued,
  };
}

type QueuedWarm = { rootIRIs?: string[] };

/**
 * Subscribe to the change bus and recompute only affected root instances.
 *
 * Uses entity-level events: when `data` is absent, all dependents of the
 * changed type are treated as dirty (documented limitation in ESCALATIONS).
 *
 * `warm()`'s own `writeStatements` calls re-emit `upsert` events on the store
 * change bus (dual assertion), so this subscription would otherwise trigger
 * itself. Two guards keep that self-triggering from becoming an unbounded,
 * concurrently-racing write loop:
 *  - **Always `skipFresh: true`.** `warm()`'s fingerprint check already
 *    distinguishes "inputs actually changed" (re-warm needed) from "an echo
 *    of our own write" (fingerprint unchanged, `writesIssued: 0`, no further
 *    event emitted — the loop terminates). Forcing `skipFresh: false` here
 *    defeats that mechanism and was the source of an observed crash
 *    (concurrent `warm()` calls racing a read-modify-write on the same
 *    document via `loadDocument` → `applyStatementWrites` → `persistDocument`).
 *  - **Single-flight with one coalesced trailing run.** Overlapping triggers
 *    (including self-triggers) never start a second concurrent `warm()`
 *    against the same store; they merge into the next run once the current
 *    one finishes.
 */
export function subscribeCalcInvalidation(args: {
  store: WarmStore & {
    subscribe: (listener: (event: EntityChangeEvent) => void) => Unsubscribe;
  };
  profile: CompiledProfile;
  domainSchema: JSONSchema7;
  /** Root type(s) to re-warm when affected. */
  rootTypeName: string;
  affectedPlanner?: AffectedInstancePlanner;
  agent?: string;
  onError?: (error: unknown) => void;
}): CalcInvalidationHandle {
  const {
    store,
    profile,
    domainSchema,
    rootTypeName,
    affectedPlanner,
    agent,
    onError,
  } = args;

  let running: Promise<void> | null = null;
  let queued: QueuedWarm | null = null;

  const runOrQueue = (task: QueuedWarm): void => {
    if (running) {
      // A full sweep (`rootIRIs` undefined) subsumes any queued targeted run.
      if (!queued || queued.rootIRIs === undefined) {
        if (!queued) queued = task;
        else if (task.rootIRIs === undefined) queued = task;
      } else if (task.rootIRIs === undefined) {
        queued = task;
      } else {
        queued = {
          rootIRIs: uniq([...queued.rootIRIs, ...task.rootIRIs]),
        };
      }
      return;
    }

    running = (async () => {
      try {
        await warm(store, profile, rootTypeName, domainSchema, {
          rootIRIs: task.rootIRIs,
          agent,
          skipFresh: true,
        });
      } catch (error) {
        onError?.(error);
      } finally {
        running = null;
        if (queued) {
          const next = queued;
          queued = null;
          runOrQueue(next);
        }
      }
    })();
  };

  const unsubscribe = store.subscribe((event) => {
    try {
      if (event.changeType === "remove") {
        runOrQueue({});
        return;
      }

      const dirtyScopes = dirtyScopesForChange(profile, event.typeName);
      if (dirtyScopes.length === 0) return;

      if (event.typeName === rootTypeName) {
        runOrQueue({ rootIRIs: [event.entityIRI] });
        return;
      }

      if (affectedPlanner) {
        climbAffectedRoots({
          domainSchema,
          planner: affectedPlanner,
          childTypeName: event.typeName,
          childIRIs: [event.entityIRI],
          rootTypeName,
        })
          .then((climbed) => {
            runOrQueue({
              rootIRIs:
                climbed.rootIRIs.length > 0 ? climbed.rootIRIs : undefined,
            });
          })
          .catch((error) => onError?.(error));
        return;
      }

      runOrQueue({});
    } catch (error) {
      onError?.(error);
    }
  });

  return { unsubscribe };
}

/**
 * Helper for SPARQL/Prisma-backed upward navigation: one VALUES/`in`-bound query.
 */
export function createSparqlAffectedPlanner(store: {
  filterMany: CalcEngineStore["filterMany"];
}): AffectedInstancePlanner {
  return {
    async findParents({ childIRIs, parentTypeName, edgeProperty }) {
      if (!edgeProperty) {
        return [];
      }
      const parents = await store.filterMany(parentTypeName, {
        where: {
          [edgeProperty]: {
            some: {
              "@id": { in: childIRIs },
            },
          },
        } as never,
        select: { "@id": true } as never,
      });
      return parents
        .map((p) => p["@id"])
        .filter((id): id is string => typeof id === "string");
    },
  };
}

/** Re-export for callers that need evaluate without warm. */
export { evaluateForRoots };
