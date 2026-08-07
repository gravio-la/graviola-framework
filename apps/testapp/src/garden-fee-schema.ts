import type { JSONSchema7 } from "json-schema";
import type { SchemaConfig } from "./schemaTypes";
import {
  detailUiSchemaForDefinition,
  makeSchemaConfig,
} from "./makeSchemaConfig";
import {
  gardenFeeExpected,
  gardenFeeSampleData as baseSample,
  gardenFeeSchema as baseSchema,
} from "@graviola/calc-fixtures";
import {
  compileCalcProfile,
  createCalcProfileSidecar,
} from "@graviola/formula-dependency";
import { evaluateCompiledProfileDeterministic } from "@graviola/formula-runtime";
import { schemaIdentityOfSync } from "@graviola/json-schema-utils";
import {
  baseMetaSchemaProfile,
  deriveExtendedSchema,
  extendMetaSchema,
  type MetaStampingConfig,
} from "@graviola/meta-schema";
import { deriveProvenanceSchema } from "@graviola/statement-meta";
import { annotateCalcSchema } from "./demo/annotateCalcSchema";

/**
 * Demo schema: base garden-fee plus VAT / gross fee for a second stratification beat.
 * Domain schema stays free of UI-only `$stmt` / `$meta` grafts.
 */
export const gardenFeeSchema = {
  ...baseSchema,
  $id: "https://example.org/garden-fee/demo-v2",
  version: "2.0.0",
  definitions: {
    ...(baseSchema.definitions as Record<string, JSONSchema7>),
    Garden: {
      type: "object",
      properties: {
        ...((baseSchema.definitions as Record<string, JSONSchema7>).Garden
          .properties as Record<string, JSONSchema7>),
        vat_rate: {
          type: "number",
          description: "VAT as fraction (e.g. 0.19)",
        },
        annual_fee_gross: {
          type: "number",
          readOnly: true,
          description: "annual_fee × (1 + vat_rate)",
        },
      },
    },
  },
} as JSONSchema7;

const identity = schemaIdentityOfSync(gardenFeeSchema);

export const gardenFeeSidecar = createCalcProfileSidecar(identity, {
  "#/definitions/Plot/properties/billable_area": {
    formula: "width_m * length_m",
  },
  "#/definitions/Patch/properties/billable_area_total": {
    aggregate: { type: "sum", over: "plots", field: "billable_area" },
  },
  "#/definitions/Garden/properties/total_billable": {
    formula: "patch.billable_area_total",
  },
  "#/definitions/Garden/properties/annual_fee": {
    formula: "total_billable * fee_rate_per_sqm",
  },
  "#/definitions/Garden/properties/annual_fee_gross": {
    formula: "annual_fee * (1 + vat_rate)",
  },
});

export const gardenFeeCompiledProfile = compileCalcProfile(
  gardenFeeSidecar,
  gardenFeeSchema,
);

export const gardenFeeSampleData = {
  ...baseSample,
  vat_rate: 0.19,
};

export const gardenFeeDemoValues = evaluateCompiledProfileDeterministic(
  gardenFeeCompiledProfile,
  gardenFeeSampleData,
);

export const gardenFeeExpectedDemo = {
  ...gardenFeeExpected,
  /** 95 * 1.19 */
  gardenAnnualFeeGross: 113.05,
};

const calcDisplayHints = {
  "#/definitions/Plot/properties/billable_area": "area",
  "#/definitions/Patch/properties/billable_area_total": "area",
  "#/definitions/Garden/properties/total_billable": "area",
  "#/definitions/Garden/properties/annual_fee": "currency",
  "#/definitions/Garden/properties/annual_fee_gross": "currency",
} as const;

/** Domain schema with `x-calc` annotations for structural detail dispatch. */
export const gardenFeeAnnotatedSchema = annotateCalcSchema(
  gardenFeeSchema,
  gardenFeeCompiledProfile,
  { displayByScope: calcDisplayHints },
);

const statementPolicies = {
  "Plot.billable_area": "always",
  "Patch.billable_area_total": "always",
  "Garden.total_billable": "always",
  "Garden.annual_fee": "always",
  "Garden.annual_fee_gross": "always",
} as const;

/** Display schema: calc annotations + grafted `$stmt` siblings. */
export const gardenFeeProvenanceSchema = deriveProvenanceSchema(
  gardenFeeAnnotatedSchema,
  undefined,
  { policies: { ...statementPolicies } },
);

export const gardenFeeMetaSchema = extendMetaSchema(baseMetaSchemaProfile, {
  type: "object",
  properties: {
    reviewStatus: {
      type: "string",
      enum: ["draft", "reviewed", "published"],
    },
  },
});

export const gardenFeeExtendedSchema = deriveExtendedSchema(
  gardenFeeProvenanceSchema,
  gardenFeeMetaSchema,
);

export const gardenFeeMetaStamping: MetaStampingConfig = {
  enabled: true,
  schema: gardenFeeMetaSchema,
  fields: {
    created: true,
    modified: true,
    schemaFingerprint: true,
  },
};

const grossNorth =
  (gardenFeeDemoValues.annual_fee as number) *
  (1 + (gardenFeeSampleData.vat_rate as number));

/** Second garden for table contrast (different rate + reduced VAT). */
export const gardenFeeSampleDataSouth = {
  "@id": "https://example.org/garden/2",
  "@type": "Garden",
  name: "Allotment South",
  fee_rate_per_sqm: 3,
  vat_rate: 0.07,
  patch: {
    "@id": "https://example.org/patch/2",
    plots: [
      {
        "@id": "https://example.org/plot/3",
        width_m: 5,
        length_m: 5,
      },
      {
        "@id": "https://example.org/plot/4",
        width_m: 2,
        length_m: 4,
      },
    ],
  },
};

export const gardenFeeDemoValuesSouth = evaluateCompiledProfileDeterministic(
  gardenFeeCompiledProfile,
  gardenFeeSampleDataSouth,
);

export const gardenFeeExpectedSouth = {
  plotBillable: [25, 8],
  patchTotal: 33,
  gardenTotalBillable: 33,
  gardenAnnualFee: 99,
  gardenAnnualFeeGross: 105.93,
};

/** Seed includes two gardens with named IRIs (navigable patch/plot details). */
export const gardenFeeInitialTurtle = `@prefix ex: <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://example.org/garden/1> a ex:Garden ;
  ex:name "Allotment North" ;
  ex:fee_rate_per_sqm "2.5"^^xsd:decimal ;
  ex:vat_rate "0.19"^^xsd:decimal ;
  ex:total_billable "38"^^xsd:decimal ;
  ex:annual_fee "95"^^xsd:decimal ;
  ex:annual_fee_gross "${grossNorth}"^^xsd:decimal ;
  ex:patch <https://example.org/patch/1> .

<https://example.org/patch/1> a ex:Patch ;
  ex:billable_area_total "38"^^xsd:decimal ;
  ex:plots <https://example.org/plot/1>, <https://example.org/plot/2> .

<https://example.org/plot/1> a ex:Plot ;
  ex:width_m "4"^^xsd:decimal ;
  ex:length_m "5"^^xsd:decimal ;
  ex:billable_area "20"^^xsd:decimal .

<https://example.org/plot/2> a ex:Plot ;
  ex:width_m "3"^^xsd:decimal ;
  ex:length_m "6"^^xsd:decimal ;
  ex:billable_area "18"^^xsd:decimal .

<https://example.org/garden/2> a ex:Garden ;
  ex:name "Allotment South" ;
  ex:fee_rate_per_sqm "3"^^xsd:decimal ;
  ex:vat_rate "0.07"^^xsd:decimal ;
  ex:total_billable "33"^^xsd:decimal ;
  ex:annual_fee "99"^^xsd:decimal ;
  ex:annual_fee_gross "${gardenFeeExpectedSouth.gardenAnnualFeeGross}"^^xsd:decimal ;
  ex:patch <https://example.org/patch/2> .

<https://example.org/patch/2> a ex:Patch ;
  ex:billable_area_total "33"^^xsd:decimal ;
  ex:plots <https://example.org/plot/3>, <https://example.org/plot/4> .

<https://example.org/plot/3> a ex:Plot ;
  ex:width_m "5"^^xsd:decimal ;
  ex:length_m "5"^^xsd:decimal ;
  ex:billable_area "25"^^xsd:decimal .

<https://example.org/plot/4> a ex:Plot ;
  ex:width_m "2"^^xsd:decimal ;
  ex:length_m "4"^^xsd:decimal ;
  ex:billable_area "8"^^xsd:decimal .
`;

const gardenFeeTableUiSchema = {
  type: "Table" as const,
  mode: "blacklist" as const,
  columns: [
    { scope: "#/properties/$meta", visibility: "forbidden" as const },
    {
      scope: "#/properties/total_billable$stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/annual_fee$stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/annual_fee_gross$stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/total_billable__stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/annual_fee__stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/annual_fee_gross__stmt",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/entityMeta",
      visibility: "forbidden" as const,
    },
    {
      scope: "#/properties/total_billable",
      label: "Billable m²",
      rank: 10,
    },
    { scope: "#/properties/annual_fee", label: "Net fee", rank: 20 },
    {
      scope: "#/properties/annual_fee_gross",
      label: "Gross fee",
      rank: 30,
    },
    { scope: "#/properties/vat_rate", label: "VAT", rank: 40 },
  ],
};

const baseGardenFeeConfig = makeSchemaConfig({
  schemaName: "garden-fee",
  label: "Garden fee (calc demo)",
  description:
    "Plot → Patch → Garden → VAT gross. Live calc + structural provenance affordances.",
  version: "2.0.0",
  color: "#558b2f",
  icon: "🌱",
  storageKey: "testapp-garden-fee-v4",
  initialData: gardenFeeInitialTurtle,
  baseIRI: "https://example.org/",
  entityBaseIRI: "https://example.org/",
  schema: gardenFeeSchema,
  formSchema: gardenFeeAnnotatedSchema,
  extendedSchema: gardenFeeExtendedSchema,
  annotationMetaSchema: gardenFeeMetaSchema,
  metaStamping: gardenFeeMetaStamping,
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
  annotationDetailUiSchemaScopeOverrides: {
    Garden: { layoutType: "VerticalLayout" },
  },
  tableUiSchema: gardenFeeTableUiSchema,
});

/** Detail UI generated from provenance/display schema so `$stmt` controls exist. */
export const gardenFeeSchemaConfig: SchemaConfig = {
  ...baseGardenFeeConfig,
  detailUiSchemata: {
    Garden: detailUiSchemaForDefinition(gardenFeeExtendedSchema, "Garden", {
      skipScope: ["#/properties/$meta", "#/properties/entityMeta"],
      scopeOverride: {
        "#/properties/total_billable__stmt": {
          type: "Control",
          scope: "#/properties/total_billable__stmt",
          label: "Statements · total_billable",
        },
        "#/properties/annual_fee__stmt": {
          type: "Control",
          scope: "#/properties/annual_fee__stmt",
          label: "Statements · annual_fee",
        },
        "#/properties/annual_fee_gross__stmt": {
          type: "Control",
          scope: "#/properties/annual_fee_gross__stmt",
          label: "Statements · annual_fee_gross",
        },
      },
    }),
    Patch: detailUiSchemaForDefinition(gardenFeeExtendedSchema, "Patch"),
    Plot: detailUiSchemaForDefinition(gardenFeeExtendedSchema, "Plot"),
  },
};

export { gardenFeeExpected };
