import type { JSONSchema7 } from "json-schema";
import type { SchemaConfig } from "./schemaTypes";
import { makeSchemaConfig } from "./makeSchemaConfig";
import {
  compileCalcProfile,
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";

export const gardenFeeCompiledProfile = compileCalcProfile(
  gardenFeeSidecar,
  gardenFeeSchema,
);

/** Pre-computed demo values for fixture turtle (stored fields only). */
export const gardenFeeDemoValues = evaluateCompiledProfileDeterministic(
  gardenFeeCompiledProfile,
  gardenFeeSampleData,
);

export const gardenFeeInitialTurtle = `@prefix ex: <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://example.org/garden/1> a ex:Garden ;
  ex:name "Allotment North" ;
  ex:fee_rate_per_sqm "2.5"^^xsd:decimal ;
  ex:patch _:patch1 .

_:patch1 a ex:Patch ;
  ex:plots _:plot1, _:plot2 .

_:plot1 a ex:Plot ;
  ex:width_m "4"^^xsd:decimal ;
  ex:length_m "5"^^xsd:decimal .

_:plot2 a ex:Plot ;
  ex:width_m "3"^^xsd:decimal ;
  ex:length_m "6"^^xsd:decimal .
`;

export const gardenFeeSchemaConfig: SchemaConfig = makeSchemaConfig({
  schemaName: "garden-fee",
  label: "Garden fee (calc demo)",
  description:
    "Plot → Patch → Garden chained computeds. Client-side evaluation via formula-runtime.",
  version: "1.0.0",
  color: "#558b2f",
  icon: "🌱",
  storageKey: "testapp-garden-fee-v2",
  initialData: gardenFeeInitialTurtle,
  baseIRI: "https://example.org/",
  entityBaseIRI: "https://example.org/",
  schema: gardenFeeSchema as JSONSchema7,
  primaryFields: {
    Garden: { label: "name" },
    Patch: { label: "@id" },
    Plot: { label: "@id" },
  },
  typeNameLabelMap: {
    Garden: "Garden",
    Patch: "Patch",
    Plot: "Plot",
  },
  typeNameUiSchemaOptionsMap: {},
});

export { gardenFeeExpected, gardenFeeSampleData };
