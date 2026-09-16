import type {
  FacetFilter,
  FacetResult,
  FacetStats,
} from "@graviola/store-core";
import { isFacetFilterRange } from "@graviola/store-core";
import { propertyNameFromScope } from "@graviola/search-facet-schema";

import type {
  FacetFieldSpec,
  RoutingPolicy,
  TypeRouting,
} from "./routing/build-routing-policy";
import {
  isFacetProperty,
  resolveIndexField,
} from "./routing/build-routing-policy";

function facetSpecForField(
  routing: TypeRouting,
  field: string,
): FacetFieldSpec | undefined {
  return routing.facetFields.find((f) => f.field === field);
}

/** Rewrite range filters onto numeric companion fields when declared in the sidecar. */
export function rewriteFiltersForIndex(
  routing: TypeRouting,
  filters: FacetFilter[] | undefined,
): FacetFilter[] | undefined {
  if (!filters?.length) return filters;
  return filters.map((f) => {
    if (!isFacetFilterRange(f)) return f;
    const spec = facetSpecForField(routing, f.field);
    const numericField = spec?.annotation.numericField;
    if (!numericField) return f;
    return {
      field: numericField,
      gte: f.gte,
      lte: f.lte,
    };
  });
}

export function resolveFacetIndexFields(
  routing: RoutingPolicy,
  typeName: string,
  facets: string[] | undefined,
): {
  facetIndexFields: string[];
  propertyFields: string[];
} {
  const facetIndexFields: string[] = [];
  const propertyFields: string[] = [];
  if (!facets?.length) return { facetIndexFields, propertyFields };

  for (const f of facets) {
    const prop = f.startsWith("#/") ? propertyNameFromScope(f) : f;
    if (!prop || !isFacetProperty(routing, typeName, prop)) continue;
    const indexField = resolveIndexField(routing, typeName, f);
    if (indexField) {
      facetIndexFields.push(indexField);
      propertyFields.push(prop);
    }
  }
  return { facetIndexFields, propertyFields };
}

function indexFieldToProperty(
  routing: TypeRouting,
  indexField: string,
): string {
  for (const [prop, idx] of routing.propertyToIndexField) {
    if (idx === indexField) return prop;
  }
  return indexField;
}

export function remapFacetDistribution(
  routing: TypeRouting,
  distribution: Record<string, Record<string, number>> | undefined,
): Record<string, Record<string, number>> | undefined {
  if (!distribution) return undefined;
  const out: Record<string, Record<string, number>> = {};
  for (const [indexField, buckets] of Object.entries(distribution)) {
    out[indexFieldToProperty(routing, indexField)] = buckets;
  }
  return out;
}

export function remapFacetStats(
  routing: TypeRouting,
  stats: Record<string, FacetStats> | undefined,
): Record<string, FacetStats> | undefined {
  if (!stats) return undefined;
  const out: Record<string, FacetStats> = {};
  for (const [indexField, s] of Object.entries(stats)) {
    out[indexFieldToProperty(routing, indexField)] = s;
  }
  return out;
}

export function facetDistributionToResult(
  distribution: Record<string, Record<string, number>> | undefined,
  propertyFields: string[],
  matched: number,
  facetStats?: Record<string, FacetStats>,
): FacetResult {
  const facets: FacetResult["facets"] = {};
  for (const prop of propertyFields) {
    const buckets = distribution?.[prop];
    facets[prop] = buckets
      ? Object.entries(buckets).map(([value, count]) => ({ value, count }))
      : [];
  }
  return { matched, facets, facetStats };
}

export function facetResultFromSearch(
  routing: TypeRouting,
  response: {
    estimatedTotalHits?: number;
    facetDistribution?: Record<string, Record<string, number>>;
    facetStats?: Record<string, FacetStats>;
  },
  propertyFields: string[],
): FacetResult {
  const matched = response.estimatedTotalHits ?? 0;
  const remapped = remapFacetDistribution(routing, response.facetDistribution);
  const remappedStats = remapFacetStats(routing, response.facetStats);
  return facetDistributionToResult(
    remapped,
    propertyFields,
    matched,
    remappedStats,
  );
}
