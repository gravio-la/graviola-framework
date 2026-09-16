export * from "./registry";
export * from "./formatters";
export * from "./hooks/useFacetSelection";
export * from "./hooks/useFacetedSearch";
export * from "./components/SearchBarWithFilters";
export * from "./components/QuickFacetRow";
export * from "./components/FacetDrawer";
export * from "./components/ResultsHeader";
export * from "./renderers/defaultRenderers";
export { TermsChipsFacet } from "./renderers/TermsChipsFacet";
export { MimeTypeFacet } from "./renderers/MimeTypeFacet";

import { defaultFacetRenderers } from "./renderers/defaultRenderers";
import { registerFacetRenderer } from "./registry";

for (const entry of defaultFacetRenderers) {
  registerFacetRenderer(entry);
}
