import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { SearchFacetSchema } from "@graviola/search-facet-schema";
import type { JSONSchema7 } from "json-schema";

import type { FullTextSearchAdapter, IndexSettings } from "../engine";
import {
  prepareFulltextIndexes,
  settingsForType,
  type PrepareFulltextIndexesOptions,
  type PrepareFulltextIndexesResult,
  type TypeIndexSummary,
} from "../prepare/prepareFulltextIndexes";
import {
  buildRoutingPolicy,
  type RoutingPolicy,
} from "../routing/build-routing-policy";
import {
  diffIndexSettings,
  hasAnyDrift,
  type IndexSettingsDrift,
} from "./indexSettingsDiff";

export type LifecycleBaseOptions = {
  adapter: FullTextSearchAdapter;
  searchFacetSchema: SearchFacetSchema;
  schema?: JSONSchema7;
  primaryFields?: PrimaryFieldDeclaration;
  scopeToIndexField?: Record<string, string>;
  indexNameForType?: (typeName: string) => string;
};

export type TypeIndexDiff = {
  typeName: string;
  indexUid: string;
  searchable: boolean;
  exists: boolean;
  desired: IndexSettings | null;
  live: IndexSettings | null;
  numberOfDocuments: number | null;
  drift: IndexSettingsDrift | null;
};

export type DiffFulltextIndexesResult = {
  routing: RoutingPolicy;
  types: TypeIndexDiff[];
  /** True when any searchable type is missing or has settings drift. */
  hasDrift: boolean;
};

export type DescribeFulltextIndexesResult = DiffFulltextIndexesResult & {
  types: (TypeIndexDiff & TypeIndexSummary)[];
};

function buildDesiredSummaries(options: LifecycleBaseOptions): {
  routing: RoutingPolicy;
  summaries: TypeIndexSummary[];
} {
  const routing = buildRoutingPolicy({
    sidecar: options.searchFacetSchema,
    primaryFields: options.primaryFields,
    scopeToIndexField: options.scopeToIndexField,
    indexNameForType: options.indexNameForType,
    adapter: options.adapter,
  });

  const summaries: TypeIndexSummary[] = [];
  for (const [, typeRouting] of routing.types) {
    if (!typeRouting.searchable) {
      summaries.push({
        typeName: typeRouting.typeName,
        indexUid: typeRouting.indexUid,
        searchable: false,
        searchableAttributes: [],
        filterableAttributes: typeRouting.facetFields.map((f) => f.indexField),
        sortableAttributes: [],
        facetFields: typeRouting.facetFields.map((f) => ({
          field: f.field,
          mode: f.mode,
        })),
      });
      continue;
    }
    const settings = settingsForType(typeRouting);
    summaries.push({
      typeName: typeRouting.typeName,
      indexUid: typeRouting.indexUid,
      searchable: true,
      searchableAttributes: settings.searchableAttributes,
      filterableAttributes: settings.filterableAttributes,
      sortableAttributes: settings.sortableAttributes ?? [],
      facetFields: typeRouting.facetFields.map((f) => ({
        field: f.field,
        mode: f.mode,
      })),
    });
  }
  return { routing, summaries };
}

/**
 * Compare desired sidecar-driven settings against live engine indexes.
 */
export async function diffFulltextIndexes(
  options: LifecycleBaseOptions,
): Promise<DiffFulltextIndexesResult> {
  const { routing, summaries } = buildDesiredSummaries(options);
  const types: TypeIndexDiff[] = [];
  let hasDrift = false;

  for (const summary of summaries) {
    if (!summary.searchable) {
      types.push({
        typeName: summary.typeName,
        indexUid: summary.indexUid,
        searchable: false,
        exists: false,
        desired: null,
        live: null,
        numberOfDocuments: null,
        drift: null,
      });
      continue;
    }

    const desired: IndexSettings = {
      primaryKey: "id",
      searchableAttributes: summary.searchableAttributes,
      filterableAttributes: summary.filterableAttributes,
      sortableAttributes: summary.sortableAttributes,
    };

    const live =
      (await options.adapter.getIndexSettings?.(summary.indexUid)) ?? null;
    const stats =
      (await options.adapter.getIndexStats?.(summary.indexUid)) ?? null;
    const exists = live != null;
    const drift = diffIndexSettings(desired, live);
    if (!exists || hasAnyDrift(drift)) hasDrift = true;

    types.push({
      typeName: summary.typeName,
      indexUid: summary.indexUid,
      searchable: true,
      exists,
      desired,
      live,
      numberOfDocuments: stats?.numberOfDocuments ?? null,
      drift,
    });
  }

  return { routing, types, hasDrift };
}

/**
 * Human/JSON status: desired settings, live settings, doc counts, drift.
 */
export async function describeFulltextIndexes(
  options: LifecycleBaseOptions,
): Promise<DescribeFulltextIndexesResult> {
  const { routing, summaries } = buildDesiredSummaries(options);
  const diff = await diffFulltextIndexes(options);
  const byType = new Map(summaries.map((s) => [s.typeName, s]));

  return {
    routing,
    hasDrift: diff.hasDrift,
    types: diff.types.map((t) => {
      const summary = byType.get(t.typeName)!;
      return { ...summary, ...t };
    }),
  };
}

/**
 * Augment: create missing indexes and PATCH settings; keep existing documents.
 */
export async function pushFulltextIndexes(
  options: PrepareFulltextIndexesOptions,
): Promise<PrepareFulltextIndexesResult> {
  return prepareFulltextIndexes(options);
}

async function forEachSearchableIndex(
  options: LifecycleBaseOptions,
  fn: (indexUid: string, typeName: string) => Promise<void>,
): Promise<{ typeNames: string[] }> {
  const { summaries } = buildDesiredSummaries(options);
  const typeNames: string[] = [];
  for (const summary of summaries) {
    if (!summary.searchable) continue;
    typeNames.push(summary.typeName);
    await fn(summary.indexUid, summary.typeName);
  }
  return { typeNames };
}

/**
 * Empty documents for all searchable types (indexes remain).
 */
export async function clearFulltextIndexes(
  options: LifecycleBaseOptions,
): Promise<{ cleared: string[] }> {
  if (typeof options.adapter.clearIndex !== "function") {
    throw new Error(
      `Adapter "${options.adapter.engine}" does not support clearIndex`,
    );
  }
  const { typeNames } = await forEachSearchableIndex(options, async (uid) => {
    await options.adapter.clearIndex!(uid);
  });
  return { cleared: typeNames };
}

/**
 * Delete indexes for all searchable types (regenerate on next push).
 */
export async function resetFulltextIndexes(
  options: LifecycleBaseOptions,
): Promise<{ deleted: string[] }> {
  if (typeof options.adapter.deleteIndex !== "function") {
    throw new Error(
      `Adapter "${options.adapter.engine}" does not support deleteIndex`,
    );
  }
  const { typeNames } = await forEachSearchableIndex(options, async (uid) => {
    await options.adapter.deleteIndex!(uid);
  });
  return { deleted: typeNames };
}

export type PopulateFromStoreOptions = LifecycleBaseOptions & {
  /**
   * Composite FT store (or any object) exposing `importAllSearchableTypes`.
   * Typically from `initFulltextSearchStore`.
   */
  ftStore: {
    importAllSearchableTypes: (
      source: unknown,
      options?: { order?: string[]; limit?: number },
    ) => Promise<Record<string, unknown[]>>;
  };
  /** Primary / source store with `list` + `loadOne`. */
  source: unknown;
  order?: string[];
  limit?: number;
};

export type PopulateFromStoreResult = {
  byType: Record<string, number>;
  total: number;
};

/**
 * Project entities from a primary store into FT indexes via the composite store.
 */
export async function populateFromStore(
  options: PopulateFromStoreOptions,
): Promise<PopulateFromStoreResult> {
  const imported = await options.ftStore.importAllSearchableTypes(
    options.source,
    { order: options.order, limit: options.limit },
  );
  const byType: Record<string, number> = {};
  let total = 0;
  for (const [typeName, docs] of Object.entries(imported)) {
    const count = Array.isArray(docs) ? docs.length : 0;
    byType[typeName] = count;
    total += count;
  }
  return { byType, total };
}

export type ReindexFromStoreOptions = PopulateFromStoreOptions & {
  /**
   * When true: delete indexes, push, then populate (full regenerate).
   * When false (default): clear documents, push settings, then populate.
   */
  full?: boolean;
};

export type ReindexFromStoreResult = {
  mode: "clear" | "full";
  push: PrepareFulltextIndexesResult;
  populate: PopulateFromStoreResult;
};

/**
 * Rebuild index contents from the primary store.
 * Default: clear docs + push settings + populate.
 * `--full`: reset (delete) + push + populate.
 */
export async function reindexFromStore(
  options: ReindexFromStoreOptions,
): Promise<ReindexFromStoreResult> {
  const mode = options.full ? "full" : "clear";
  if (options.full) {
    await resetFulltextIndexes(options);
  } else {
    await clearFulltextIndexes(options);
  }
  const push = await pushFulltextIndexes(options);
  const populate = await populateFromStore(options);
  return { mode, push, populate };
}
