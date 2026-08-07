import type { JSONSchema7 } from "json-schema";
import { schemaIdentityOfSync } from "@graviola/json-schema-utils";

export const gardenFeeSchema = {
  $id: "https://example.org/garden-fee/v1",
  version: "1.0.0",
  definitions: {
    Plot: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        width_m: { type: "number" },
        length_m: { type: "number" },
        billable_area: { type: "number", readOnly: true },
      },
    },
    Patch: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        plots: {
          type: "array",
          items: { $ref: "#/definitions/Plot" },
        },
        billable_area_total: { type: "number", readOnly: true },
      },
    },
    Garden: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        patch: { $ref: "#/definitions/Patch" },
        fee_rate_per_sqm: { type: "number" },
        total_billable: { type: "number", readOnly: true },
        annual_fee: { type: "number", readOnly: true },
      },
    },
  },
} as JSONSchema7;

const identity = schemaIdentityOfSync(gardenFeeSchema);

/**
 * Golden calc-profile sidecar as a plain literal. This fixture package stays a
 * dependency leaf: it must not import from `@graviola/formula-dependency`
 * (which devDepends on these fixtures for its own tests). Consumers assign it
 * where `CalcProfileSidecar` is expected; structural typing keeps it honest.
 */
export const gardenFeeSidecar = {
  $schema: "https://graviola.gra.one/calc-profile/v1",
  appliesTo: identity,
  slots: {
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
  },
} as const;

/** Sample instance data — every named entity carries `@type` (required by the runtime). */
export const gardenFeeSampleData = {
  "@id": "https://example.org/garden/1",
  "@type": "Garden",
  name: "Allotment North",
  fee_rate_per_sqm: 2.5,
  patch: {
    "@id": "https://example.org/patch/1",
    "@type": "Patch",
    plots: [
      {
        "@id": "https://example.org/plot/1",
        "@type": "Plot",
        width_m: 4,
        length_m: 5,
      },
      {
        "@id": "https://example.org/plot/2",
        "@type": "Plot",
        width_m: 3,
        length_m: 6,
      },
    ],
  },
};

/**
 * Statement policies for materializing every computed slot (`$stmt` with
 * `wasGeneratedBy` provenance). Shape matches
 * `StatementPolicyMap` from `@graviola/statement-meta` (structural — this
 * package stays a dependency leaf).
 */
export const gardenFeeStatementPolicies: Record<string, "always" | "never"> = {
  "Plot.billable_area": "always",
  "Patch.billable_area_total": "always",
  "Garden.total_billable": "always",
  "Garden.annual_fee": "always",
};

/** Expected computed values for {@link gardenFeeSampleData}. */
export const gardenFeeExpected = {
  plotBillable: [20, 18],
  patchTotal: 38,
  gardenTotalBillable: 38,
  gardenAnnualFee: 95,
};
