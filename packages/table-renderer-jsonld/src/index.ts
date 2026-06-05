export {
  mkJsonLdAccessor,
  jsonLdColumnRegistry,
  jsonldPrimitiveEntry,
  jsonldDateEntry,
  jsonldBooleanEntry,
  jsonldEnumEntry,
  jsonldIdRefEntry,
  jsonldNestedObjectChipEntry,
  jsonldNestedArrayChipsEntry,
  jsonldArrayPrimitiveEntry,
  jsonldFallbackOmitEntry,
} from "./registry";

export {
  JsonLdTableProvider,
  useJsonLdTableContext,
  type JsonLdChipComponentProps,
  type JsonLdTableContextValue,
} from "./JsonLdTableContext";

export { DefaultEntityChip } from "./defaultEntityChip";
export { JsonLdValueCell } from "./cells/JsonLdValueCell";
export { JsonLdEntityChipCell } from "./cells/JsonLdEntityChipCell";
export { JsonLdEntityChipArrayCell } from "./cells/JsonLdEntityChipArrayCell";
export {
  composeJsonLdColumns,
  type ComposeJsonLdColumnsOptions,
} from "./composeJsonLdColumns";
export { scopeToPropertyKey } from "./scope";

/** @deprecated Use {@link JsonLdEntityChipCell} — kept for existing imports/tests. */
export { JsonLdEntityChipCell as JsonLdChipCell } from "./cells/JsonLdEntityChipCell";
