import {
  facetFieldNamesForSelection,
  normalizeBuckets,
  selectionToFacetFilters,
  type FacetDescriptor,
  type FacetSelection,
  type FacetedSearchStore,
} from "@graviola/facet-core";
import { usePagedSearch } from "@graviola/edb-state-hooks";
import type {
  FacetBucket,
  FacetStats,
  SchemaRegistry,
} from "@graviola/store-core";
import { useMemo } from "react";

export type UseFacetedSearchParams<R extends SchemaRegistry = SchemaRegistry> =
  {
    store: FacetedSearchStore<R> | null;
    typeNames: Array<keyof R & string>;
    q: string;
    page: number;
    limit: number;
    selection: FacetSelection;
    descriptors: FacetDescriptor[];
    /** Scopes to request in-band (quick row + expanded drawer sections) */
    visibleScopes: string[];
    hydrate?: boolean;
    enabled?: boolean;
    onPageChange: (page: number) => void;
  };

export type FacetedSearchResult = ReturnType<typeof usePagedSearch> & {
  facetBuckets: Record<string, FacetBucket[]>;
  facetStats: Record<string, FacetStats>;
};

export function useFacetedSearch<R extends SchemaRegistry>(
  params: UseFacetedSearchParams<R>,
): FacetedSearchResult {
  const {
    store,
    typeNames,
    q,
    page,
    limit,
    selection,
    descriptors,
    visibleScopes,
    hydrate = false,
    enabled = true,
    onPageChange,
  } = params;

  const primaryType = typeNames[0];
  const filters = useMemo(() => {
    if (!primaryType) return [];
    return selectionToFacetFilters(selection, descriptors, primaryType);
  }, [selection, descriptors, primaryType]);

  const facets = useMemo(() => {
    const names = new Set<string>();
    for (const scope of visibleScopes) {
      const d = descriptors.find((x) => x.scope === scope);
      if (d) names.add(d.field);
    }
    return [...names];
  }, [visibleScopes, descriptors]);

  const search = usePagedSearch({
    store,
    typeName: primaryType,
    query: q,
    page,
    limit,
    filters,
    facets,
    hydrate,
    enabled: enabled && Boolean(store && primaryType),
    queryKeyPrefix: "faceted-search",
    onPageChange,
  });

  const facetBuckets = useMemo(() => {
    const out: Record<string, FacetBucket[]> = {};
    if (!search.facetDistribution) return out;
    for (const d of descriptors) {
      const raw = search.facetDistribution[d.field];
      if (!raw) continue;
      out[d.scope] = normalizeBuckets(raw, selection, d);
    }
    return out;
  }, [search.facetDistribution, descriptors, selection]);

  const facetStats = search.facetStats ?? {};

  return {
    ...search,
    facetBuckets,
    facetStats,
  };
}

export { facetFieldNamesForSelection, selectionToFacetFilters };
