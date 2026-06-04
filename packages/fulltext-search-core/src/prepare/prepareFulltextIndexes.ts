import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { SearchFacetSchema } from "@graviola/search-facet-schema";
import type { JSONSchema7 } from "json-schema";

import type { FullTextSearchAdapter, IndexSettings } from "../engine";
import {
  buildRoutingPolicy,
  type RoutingPolicy,
  type TypeRouting,
} from "../routing/build-routing-policy";

export type PrepareFulltextIndexesOptions = {
  adapter: FullTextSearchAdapter;
  searchFacetSchema: SearchFacetSchema;
  schema?: JSONSchema7;
  primaryFields?: PrimaryFieldDeclaration;
  scopeToIndexField?: Record<string, string>;
  indexNameForType?: (typeName: string) => string;
  /** Skip ensureIndex for types that already have a populated engine index. */
  existingIndexTypes?: string[];
};

export type TypeIndexSummary = {
  typeName: string;
  indexUid: string;
  searchable: boolean;
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  facetFields: { field: string; mode: string }[];
};

export type PrepareFulltextIndexesResult = {
  routing: RoutingPolicy;
  types: TypeIndexSummary[];
};

function settingsForType(routing: TypeRouting): IndexSettings {
  const filterable = routing.facetFields.map((f) => f.indexField);
  const sortable = routing.facetFields
    .filter((f) => f.mode === "range")
    .map((f) => f.indexField);

  return {
    primaryKey: "id",
    searchableAttributes: routing.fulltextIndexFields,
    filterableAttributes: [...new Set(filterable)],
    sortableAttributes: [...new Set(sortable)],
  };
}

/**
 * Bootstrap full-text indexes from a search-facet sidecar (no primary store required).
 */
export async function prepareFulltextIndexes(
  options: PrepareFulltextIndexesOptions,
): Promise<PrepareFulltextIndexesResult> {
  const routing = buildRoutingPolicy({
    sidecar: options.searchFacetSchema,
    primaryFields: options.primaryFields,
    scopeToIndexField: options.scopeToIndexField,
    indexNameForType: options.indexNameForType,
    adapter: options.adapter,
  });

  const types: TypeIndexSummary[] = [];
  const skipEnsure = new Set(options.existingIndexTypes ?? []);

  for (const [, typeRouting] of routing.types) {
    if (!typeRouting.searchable) {
      types.push({
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
    if (!skipEnsure.has(typeRouting.typeName)) {
      await options.adapter.ensureIndex(typeRouting.indexUid, settings);
    }

    types.push({
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

  return { routing, types };
}
