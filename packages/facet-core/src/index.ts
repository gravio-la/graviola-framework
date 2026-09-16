export type {
  FacetDescriptor,
  FacetSelection,
  FacetScopeSelection,
  FacetTermSelection,
  FacetRangeSelection,
  FacetValueType,
  FacetableFieldSpec,
  AvailableFacets,
} from "./types";

export {
  deriveFacetDescriptors,
  groupDescriptors,
  scopeForField,
  facetModeForField,
  type GroupedDescriptors,
} from "./descriptors";

export {
  emptySelection,
  toggleTerm,
  setRange,
  clearScope,
  clearAll,
  isScopeActive,
  activeCount,
  selectionForType,
  getScopeSelection,
} from "./selection";

export {
  selectionToFacetFilters,
  facetFieldNamesForSelection,
  typedWhereToFacetFilters,
} from "./filters";

export { normalizeBuckets, mergeFacetResults } from "./buckets";

export { serializeSelection, parseSelection } from "./url";

export { canDocumentSearch, canFacet, type FacetedSearchStore } from "./source";
