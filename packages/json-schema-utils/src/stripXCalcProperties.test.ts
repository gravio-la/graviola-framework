import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { stripXCalcProperties, X_CALC } from "./stripXCalcProperties";

describe("stripXCalcProperties", () => {
  const schema: JSONSchema7 = {
    type: "object",
    definitions: {
      Garden: {
        type: "object",
        properties: {
          name: { type: "string" },
          vat_rate: { type: "number" },
          annual_fee: {
            type: "number",
            [X_CALC]: { scope: "#/definitions/Garden/properties/annual_fee" },
          } as JSONSchema7,
          annual_fee_gross: {
            type: "number",
            [X_CALC]: {
              scope: "#/definitions/Garden/properties/annual_fee_gross",
            },
          } as JSONSchema7,
          patch: { $ref: "#/definitions/Patch" },
        },
      },
      Patch: {
        type: "object",
        properties: {
          billable_area_total: {
            type: "number",
            [X_CALC]: {
              scope: "#/definitions/Patch/properties/billable_area_total",
            },
          } as JSONSchema7,
          name: { type: "string" },
        },
      },
    },
    $ref: "#/definitions/Garden",
  };

  it("removes x-calc properties and keeps inputs", () => {
    const doc = {
      name: "North",
      vat_rate: 0.19,
      annual_fee: 95,
      annual_fee_gross: 113.05,
      patch: { name: "A", billable_area_total: 38 },
    };
    const out = stripXCalcProperties(doc, schema);
    expect(out).toEqual({
      name: "North",
      vat_rate: 0.19,
      patch: { name: "A" },
    });
  });

  it("does not strip plain readOnly without x-calc", () => {
    const local: JSONSchema7 = {
      type: "object",
      properties: {
        id: { type: "string", readOnly: true },
        fee: {
          type: "number",
          readOnly: true,
          [X_CALC]: { scope: "#/properties/fee" },
        } as JSONSchema7,
      },
    };
    const out = stripXCalcProperties({ id: "x", fee: 1 }, local);
    expect(out).toEqual({ id: "x" });
  });
});
