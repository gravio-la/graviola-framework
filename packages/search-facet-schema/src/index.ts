export type {
  SearchFacetSchema,
  FulltextIndexAnnotations,
  FulltextScopeAnnotation,
  FacetAnnotations,
  FacetScopeAnnotation,
  FacetMode,
  ScopePointer,
} from "./types";

export { loadSearchFacetSchema } from "./load-search-facet-schema";
export { searchFacetSchemaDefinition } from "./search-facet-schema-definition";

export {
  typeFromScope,
  propertyNameFromScope,
  listSearchableTypes,
  scopesForType,
} from "./scope-utils";
