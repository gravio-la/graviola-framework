export * from "./composeSparqlSelectColumns";
export * from "./tableRegistryHelper";
export * from "./listHelper";
export * from "./cellConfigRegistry";

import { cellConfigRegistry } from "./cellConfigRegistry";

export const sparqlSelectColumnRegistry = cellConfigRegistry;
export const primitiveStringEntry = cellConfigRegistry[0];
export const iriLinkEntry = cellConfigRegistry[1];
export const enumOneOfEntry = cellConfigRegistry[2];
export const booleanEntry = cellConfigRegistry[3];
export const arrayObjectMarkdownLinksEntry = cellConfigRegistry[4];
export const objectRefChipEntry = cellConfigRegistry[5];
export const iriColumnEntry = cellConfigRegistry[1];
export const primitiveNumberEntry = cellConfigRegistry[0];
export const langTaggedLiteralEntry = cellConfigRegistry[0];
