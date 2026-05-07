import type { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";

/**
 * Maps between schema-local type names and vocabulary IRIs.
 * Expected on every Store.
 */
export interface Identifies {
  typeNameToTypeIRI: StringToIRIFn;
  typeIRItoTypeName: IRIToStringFn;
}
