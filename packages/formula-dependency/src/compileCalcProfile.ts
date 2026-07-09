import type { JSONSchema7 } from "json-schema";
import Graph from "graphology";
import { willCreateCycle, topologicalSort } from "graphology-dag";
import { schemaIdentityOfSync } from "@graviola/json-schema-utils";
import type { SidecarDocument } from "@graviola/sidecar-core";
import {
  aggregateFieldComputedScope,
  inferCost,
  pathToComputedScope,
  scopeToEntityScope,
  scopeToPropertyName,
  slotDependencyPaths,
} from "./bindings";
import type {
  BoundaryProfile,
  CalcProfileSidecar,
  CalcProfileSlot,
  CompiledProfile,
  CompileCalcProfileError,
} from "./types";
import { CalcProfileCompileError } from "./types";

const AUTH_BOUNDARY_STRATUM = 1;

export function compileCalcProfile(
  sidecar: SidecarDocument<CalcProfileSlot> | CalcProfileSidecar,
  domainSchema: JSONSchema7,
  boundaryProfile: BoundaryProfile = {},
): CompiledProfile {
  const issues: CompileCalcProfileError[] = [];
  const schemaIdentity = schemaIdentityOfSync(domainSchema);

  if (
    sidecar.appliesTo.fingerprint &&
    sidecar.appliesTo.fingerprint !== schemaIdentity.fingerprint
  ) {
    issues.push({
      kind: "fingerprint-mismatch",
      expected: schemaIdentity.fingerprint,
      actual: sidecar.appliesTo.fingerprint,
      message: `Sidecar fingerprint ${sidecar.appliesTo.fingerprint} does not match schema ${schemaIdentity.fingerprint}`,
    });
  }

  const knownScopes = new Set(collectPropertyScopes(domainSchema));

  for (const scope of Object.keys(sidecar.slots)) {
    if (!knownScopes.has(scope)) {
      issues.push({
        kind: "dangling-scope",
        scope,
        message: `Dangling sidecar scope ${scope} — not found in schema ${schemaIdentity.fingerprint}`,
      });
    }
  }

  const graph = new Graph({ type: "directed", allowSelfLoops: false });
  const slotEntries = Object.entries(sidecar.slots) as [
    string,
    CalcProfileSlot,
  ][];

  for (const [scope] of slotEntries) {
    graph.addNode(scope);
  }

  const dependencyMap = new Map<string, Set<string>>();

  for (const [scope, slot] of slotEntries) {
    const { paths, errors } = slotDependencyPaths(scope, slot, domainSchema);
    for (const err of errors) {
      issues.push({
        kind: "invalid-binding",
        scope,
        path: "",
        message: err,
      });
    }

    const deps = new Set<string>();
    for (const path of paths) {
      const computedScope = pathToComputedScope(domainSchema, scope, path);
      if (computedScope && sidecar.slots[computedScope]) {
        deps.add(computedScope);
      }
    }
    if (slot.aggregate) {
      const aggScope = aggregateFieldComputedScope(
        domainSchema,
        scopeToEntityScope(scope),
        slot.aggregate,
      );
      if (aggScope && sidecar.slots[aggScope]) {
        deps.add(aggScope);
      }
    }
    dependencyMap.set(scope, deps);

    for (const dep of deps) {
      if (!graph.hasNode(dep)) graph.addNode(dep);
      if (willCreateCycle(graph, dep, scope)) {
        const chain = findPath(graph, scope, dep) ?? [scope, dep, scope];
        issues.push({
          kind: "cycle",
          chain,
          message: `Cycle detected: ${chain.join(" → ")}. Break the cycle by removing or rewriting a dependency.`,
        });
      } else {
        graph.addEdge(dep, scope);
      }
    }
  }

  if (issues.length > 0) {
    throw new CalcProfileCompileError(issues);
  }

  let order: string[];
  try {
    order = topologicalSort(graph);
  } catch {
    throw new CalcProfileCompileError([
      {
        kind: "cycle",
        chain: [],
        message: "Cycle detected in computed-field dependency graph",
      },
    ]);
  }

  const strata = new Map<string, number>();
  for (const scope of order) {
    const deps = dependencyMap.get(scope) ?? new Set<string>();
    const maxDep =
      deps.size === 0
        ? 0
        : Math.max(...[...deps].map((d) => strata.get(d) ?? 0));
    let stratum = maxDep + 1;

    const slot = sidecar.slots[scope]!;
    if (slot.aggregate) {
      stratum = Math.max(stratum, AUTH_BOUNDARY_STRATUM + 1);
    }
    if (boundaryProfile.completenessSlots?.includes(scope)) {
      stratum = Math.max(stratum, AUTH_BOUNDARY_STRATUM + 1);
    }

    strata.set(scope, stratum);
  }

  const authRuleScopes = new Set(boundaryProfile.authRuleScopes ?? []);
  for (const authScope of authRuleScopes) {
    const deps = dependencyMap.get(authScope) ?? new Set<string>();
    for (const dep of deps) {
      const depStratum = strata.get(dep) ?? 0;
      if (depStratum > AUTH_BOUNDARY_STRATUM) {
        const chain = buildDependencyChain(dependencyMap, authScope, dep);
        issues.push({
          kind: "auth-boundary-violation",
          scope: authScope,
          referencedScope: dep,
          referencedStratum: depStratum,
          chain,
          message:
            `Auth rule at ${authScope} references ${dep} (stratum ${depStratum}), ` +
            `which crosses the auth boundary (max stratum ${AUTH_BOUNDARY_STRATUM}). ` +
            `Chain: ${chain.join(" → ")}. ` +
            `Fix: reference only stratum-0/1 slots in auth rules, or move the rule below the boundary.`,
        });
      }
    }
  }

  if (issues.length > 0) {
    throw new CalcProfileCompileError(issues);
  }

  const dependents = new Map<string, string[]>();
  for (const scope of order) {
    for (const dep of dependencyMap.get(scope) ?? []) {
      const list = dependents.get(dep) ?? [];
      list.push(scope);
      dependents.set(dep, list);
    }
  }

  const slots: CompiledProfile["slots"] = {};
  for (const [scope, slot] of slotEntries) {
    slots[scope] = {
      stratum: strata.get(scope) ?? 1,
      dependents: dependents.get(scope) ?? [],
      sources: ["local"],
      cost: inferCost(slot),
      formula: slot.formula,
      bindings: slot.bindings,
      aggregate: slot.aggregate,
      eval: slot.eval ?? "auto",
      entityScope: scopeToEntityScope(scope),
      propertyName: scopeToPropertyName(scope),
    };
  }

  return { schemaIdentity, slots };
}

function collectPropertyScopes(domainSchema: JSONSchema7): string[] {
  const scopes: string[] = [];
  const defs = domainSchema.definitions ?? {};
  for (const [name, def] of Object.entries(defs)) {
    if (!def || typeof def !== "object") continue;
    const props = (def as JSONSchema7).properties ?? {};
    const entityScope = `#/definitions/${name}`;
    for (const prop of Object.keys(props)) {
      scopes.push(`${entityScope}/properties/${prop}`);
    }
  }
  if (domainSchema.properties) {
    for (const prop of Object.keys(domainSchema.properties)) {
      scopes.push(`#/properties/${prop}`);
    }
  }
  return scopes;
}

function findPath(
  graph: Graph,
  from: string,
  to: string,
): string[] | undefined {
  const visited = new Set<string>();
  const stack: string[] = [from];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === to) return [from, to];
    if (visited.has(node)) continue;
    visited.add(node);
    graph.forEachOutNeighbor(node, (neighbor) => {
      stack.push(neighbor);
    });
  }
  return undefined;
}

function buildDependencyChain(
  dependencyMap: Map<string, Set<string>>,
  start: string,
  target: string,
): string[] {
  const queue: { node: string; path: string[] }[] = [
    { node: start, path: [start] },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === target) return path;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const dep of dependencyMap.get(node) ?? []) {
      queue.push({ node: dep, path: [...path, dep] });
    }
  }
  return [start, target];
}
