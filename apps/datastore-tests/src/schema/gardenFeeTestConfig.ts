/**
 * Store configuration for the garden-fee calc fixture domain
 * (`@graviola/calc-fixtures`). Used by adapters to expose an optional
 * `calcStore` bound to the garden-fee schema, so the calc-engine contract
 * suite can run `evaluateForRoots` against a real store read instead of an
 * in-memory stand-in.
 *
 * Namespace matches the fixture sample data (`https://example.org/...`).
 */
export const GARDEN_FEE_BASE_IRI = "https://example.org/";

export const gardenFeeTypeNameToTypeIRI = (typeName: string): string =>
  `${GARDEN_FEE_BASE_IRI}${typeName}`;

export const gardenFeeTypeIRItoTypeName = (iri: string): string =>
  iri.replace(GARDEN_FEE_BASE_IRI, "");

export const gardenFeePropertyToIRI = (property: string): string =>
  `${GARDEN_FEE_BASE_IRI}${property}`;

export const gardenFeePrimaryFields = {
  Garden: { label: "name" },
} as const;

export const gardenFeeQueryBuildOptions = {
  propertyToIRI: gardenFeePropertyToIRI,
  typeIRItoTypeName: gardenFeeTypeIRItoTypeName,
  primaryFields: gardenFeePrimaryFields,
  primaryFieldExtracts: {},
};
