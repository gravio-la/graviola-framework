import {
  createAcquisitionRuntime,
  type AcquisitionRuntime,
  type DataSource,
  type FetchProvenance,
} from "@graviola/data-acquisition";
import { getViaSourcePath } from "@graviola/edb-data-mapping";
import { getAdapter } from "./adapters/registry";
import { buildAuthHeaders, type SecretsResolver } from "./auth";
import { runExampleQuery } from "./examples";
import { extractItems, normalizeCandidates } from "./normalize";
import { reconcileFromDocument } from "./reconcile";
import type {
  Candidate,
  ExampleQuery,
  ExampleResult,
  ReconciliationHit,
  SearchOverride,
  SearchShape,
  SecondaryDataSourceDeclaration,
} from "./types";

export type SecondarySourceRuntimeOptions = {
  acquisition?: AcquisitionRuntime;
  secrets?: SecretsResolver;
};

export type SecondarySourceRuntime = {
  declaration: SecondaryDataSourceDeclaration;
  search: (
    query: string,
    options?: {
      targetType?: string;
      typeHint?: string | string[];
      limit?: number;
    },
  ) => Promise<{ candidates: Candidate[]; provenance?: FetchProvenance }>;
  getEntity: (
    iri: string,
  ) => Promise<{ document: unknown; provenance?: FetchProvenance }>;
  facts: (iri: string) => Promise<Record<string, unknown>>;
  runExample: (exampleId: string) => Promise<ExampleResult>;
  reconcile: (document: unknown) => ReconciliationHit[];
};

function mergeHeaders(
  sourceHeaders: Record<string, string | unknown> | undefined,
  authHeaders: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...authHeaders };
  if (sourceHeaders) {
    for (const [k, v] of Object.entries(sourceHeaders)) {
      if (typeof v === "string") out[k] = v;
    }
  }
  return out;
}

function applyAuthToSource(
  source: DataSource,
  authHeaders: Record<string, string>,
): DataSource {
  if (!authHeaders || Object.keys(authHeaders).length === 0) return source;
  const withHeaders = source as DataSource & {
    headers?: Record<string, string | unknown>;
  };
  return {
    ...withHeaders,
    headers: mergeHeaders(withHeaders.headers, authHeaders),
  } as DataSource;
}

function mergeRecordFields<T extends Record<string, unknown>>(
  base?: T,
  override?: T,
): T | undefined {
  if (!base && !override) return undefined;
  return { ...base, ...override } as T;
}

function isFullSearchSource(
  entry: (DataSource & SearchShape) | SearchOverride,
): entry is DataSource & SearchShape {
  return entry.kind !== undefined;
}

export function mergeSearchOverride(
  base: DataSource & SearchShape,
  override: SearchOverride,
  targetType: string,
): DataSource & SearchShape {
  const baseWithBindings = base as DataSource &
    SearchShape & {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      headers?: Record<string, unknown>;
    };

  return {
    ...base,
    ...override,
    id: override.id ?? `${base.id}:${targetType}`,
    params: mergeRecordFields(baseWithBindings.params, override.params),
    query: mergeRecordFields(baseWithBindings.query, override.query),
    headers: mergeRecordFields(baseWithBindings.headers, override.headers),
  } as DataSource & SearchShape;
}

export function createSecondarySourceRuntime(
  declaration: SecondaryDataSourceDeclaration,
  options: SecondarySourceRuntimeOptions = {},
): SecondarySourceRuntime {
  const hostPolicies: Record<
    string,
    { minIntervalMs?: number; max?: number; windowMs?: number }
  > = {};
  if (declaration.rateLimit) {
    hostPolicies["*"] = declaration.rateLimit;
  }

  const acquisition =
    options.acquisition ?? createAcquisitionRuntime({ hostPolicies });

  const secrets: SecretsResolver = options.secrets ?? (() => undefined);

  let cachedAuthHeaders: Record<string, string> | null = null;

  const ensureAuth = async (): Promise<Record<string, string>> => {
    if (cachedAuthHeaders) return cachedAuthHeaders;
    cachedAuthHeaders = await buildAuthHeaders(
      declaration.auth,
      secrets,
      acquisition,
      declaration.id,
    );
    return cachedAuthHeaders;
  };

  const pickSearchSource = (targetType?: string): DataSource & SearchShape => {
    if (targetType && declaration.operations.searchByType?.[targetType]) {
      const entry = declaration.operations.searchByType[targetType];
      if (isFullSearchSource(entry)) return entry;
      return mergeSearchOverride(
        declaration.operations.search,
        entry,
        targetType,
      );
    }
    return declaration.operations.search;
  };

  const runtime: SecondarySourceRuntime = {
    declaration,

    search: async (query, opts = {}) => {
      if (declaration.kind === "adapter" && declaration.adapterId) {
        const adapter = getAdapter(declaration.adapterId);
        if (!adapter)
          throw new Error(`Adapter not found: ${declaration.adapterId}`);
        const candidates = await adapter.search(query, {
          typeName: opts.targetType,
          limit: opts.limit ?? 10,
        });
        return { candidates };
      }

      const authHeaders = await ensureAuth();
      const searchSource = pickSearchSource(opts.targetType);
      const {
        itemsPath,
        labelPath,
        idPath,
        descriptionPath,
        thumbnailPath,
        ...dataSource
      } = searchSource;
      const shape: SearchShape = {
        itemsPath,
        labelPath,
        idPath,
        descriptionPath,
        thumbnailPath,
      };

      const typeHint =
        opts.typeHint ??
        (opts.targetType
          ? declaration.typeHints?.[opts.targetType]
          : undefined);

      const result = await acquisition.fetch(
        applyAuthToSource(dataSource, authHeaders),
        {
          input: {
            q: query,
            query,
            limit: opts.limit ?? 10,
            type: Array.isArray(typeHint) ? typeHint.join(",") : typeHint,
          },
        },
      );

      if (!result.ok) throw new Error(result.error.message);

      const items = extractItems(
        result.raw ?? result.items,
        shape.itemsPath ?? itemsPath,
      );
      const idToIri = declaration.operations.getEntity.idToIri;
      const candidates = normalizeCandidates(
        items.length ? items : result.items,
        shape,
        declaration.authorityIRI,
        idToIri,
      );

      return { candidates, provenance: result.provenance };
    },

    getEntity: async (iri) => {
      if (iri == null || typeof iri !== "string" || iri.length === 0) {
        throw new Error("getEntity requires a non-empty iri or id");
      }
      if (declaration.kind === "adapter" && declaration.adapterId) {
        const adapter = getAdapter(declaration.adapterId);
        if (!adapter)
          throw new Error(`Adapter not found: ${declaration.adapterId}`);
        const document = await adapter.getEntity(iri);
        return { document };
      }

      const authHeaders = await ensureAuth();
      const { documentPath, idToIri, iriToId, ...dataSource } =
        declaration.operations.getEntity;

      let entityId = iri;
      if (iriToId?.length) {
        for (const rule of iriToId) {
          const m = iri.match(new RegExp(rule.pattern));
          if (m?.groups?.[rule.as]) {
            entityId = m.groups[rule.as]!;
            break;
          }
        }
      } else if (iri.includes("/")) {
        entityId = iri.split("/").pop() ?? iri;
      }

      const result = await acquisition.fetch(
        applyAuthToSource(dataSource, authHeaders),
        { input: { iri, entityIRI: iri, id: entityId } },
      );

      if (!result.ok) throw new Error(result.error.message);

      let document = result.items[0] ?? result.raw;
      if (documentPath) {
        document = getViaSourcePath(document, documentPath) ?? document;
      }

      // Unwrap Wikidata-style entities maps: { Q5593: { ... } }
      if (
        document &&
        typeof document === "object" &&
        !Array.isArray(document) &&
        entityId in (document as Record<string, unknown>)
      ) {
        const inner = (document as Record<string, unknown>)[entityId];
        if (inner && typeof inner === "object") {
          document = inner;
        }
      }

      return { document, provenance: result.provenance };
    },

    facts: async (iri) => {
      const { document } = await runtime.getEntity(iri);
      const paths = declaration.operations.factsPreview?.paths;
      if (!paths) return { iri, document };

      const facts: Record<string, unknown> = { iri };
      for (const [label, path] of Object.entries(paths)) {
        facts[label] = getViaSourcePath(document, path);
      }
      return facts;
    },

    runExample: async (exampleId) => {
      const example = declaration.examples.find((e) => e.id === exampleId);
      if (!example) {
        return {
          ok: false,
          assertions: [
            { pass: false, message: `Example not found: ${exampleId}` },
          ],
          durationMs: 0,
        };
      }
      return runExampleQuery(runtime, example);
    },

    reconcile: (document) =>
      reconcileFromDocument(document, declaration.identifiers),
  };

  return runtime;
}

export { runExampleQuery };
