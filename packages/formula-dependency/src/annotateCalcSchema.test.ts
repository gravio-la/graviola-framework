import { describe, expect, it } from "bun:test";
import {
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import {
  X_CALC,
  bringDefinitionToTop,
  stripXCalcProperties,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { annotateCalcSchema } from "./annotateCalcSchema";
import { compileCalcProfile } from "./compileCalcProfile";
import { CalcProfileCompileError } from "./types";

const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

describe("annotateCalcSchema", () => {
  it("marks every slot property with x-calc and readOnly", () => {
    const annotated = annotateCalcSchema(gardenFeeSchema, profile);

    const plotBillable = (annotated.definitions?.Plot as JSONSchema7)
      ?.properties?.billable_area as Record<string, unknown>;
    expect(plotBillable[X_CALC]).toEqual({
      formulaId: "#/definitions/Plot/properties/billable_area",
      stratum: 1,
      cost: "low",
      eval: "auto",
    });
    expect(plotBillable.readOnly).toBe(true);

    const annualFee = (annotated.definitions?.Garden as JSONSchema7)?.properties
      ?.annual_fee as Record<string, unknown>;
    expect((annualFee[X_CALC] as { stratum: number }).stratum).toBe(4);

    // Input schema untouched
    const original = (gardenFeeSchema.definitions?.Plot as JSONSchema7)
      ?.properties?.billable_area as Record<string, unknown>;
    expect(original[X_CALC]).toBeUndefined();
  });

  it("is idempotent", () => {
    const once = annotateCalcSchema(gardenFeeSchema, profile);
    // Second application must fail the fingerprint gate (annotation changed
    // the content hash) — annotate always starts from the raw schema.
    expect(() => annotateCalcSchema(once, profile)).toThrow(
      CalcProfileCompileError,
    );
    // Re-annotating the raw schema yields the identical result.
    const again = annotateCalcSchema(gardenFeeSchema, profile);
    expect(again).toEqual(once);
  });

  it("refuses a profile compiled for a different schema", () => {
    const otherSchema = {
      ...gardenFeeSchema,
      definitions: { ...(gardenFeeSchema as JSONSchema7).definitions },
      $id: "https://example.org/other/v1",
    } as JSONSchema7;
    expect(() => annotateCalcSchema(otherSchema, profile)).toThrow(
      CalcProfileCompileError,
    );
  });

  it("annotate → evaluate → strip leaves no computed values in the persisted doc", () => {
    const annotated = annotateCalcSchema(gardenFeeSchema, profile);
    const gardenSchema = bringDefinitionToTop(
      annotated,
      "Garden",
    ) as JSONSchema7;

    // Simulate a document whose overlay wrote computed values everywhere.
    const withComputed = {
      ...gardenFeeSampleData,
      total_billable: 38,
      annual_fee: 95,
      patch: {
        ...gardenFeeSampleData.patch,
        billable_area_total: 38,
        plots: gardenFeeSampleData.patch.plots.map((plot) => ({
          ...plot,
          billable_area: plot.width_m * plot.length_m,
        })),
      },
    };

    const stripped = stripXCalcProperties(
      withComputed as Record<string, unknown>,
      gardenSchema,
    ) as Record<string, any>;

    expect(stripped.total_billable).toBeUndefined();
    expect(stripped.annual_fee).toBeUndefined();
    expect(stripped.patch.billable_area_total).toBeUndefined();
    for (const plot of stripped.patch.plots) {
      expect(plot.billable_area).toBeUndefined();
      expect(typeof plot.width_m).toBe("number");
    }
    expect(stripped.fee_rate_per_sqm).toBe(2.5);
  });
});
