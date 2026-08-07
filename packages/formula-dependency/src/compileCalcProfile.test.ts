import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "./compileCalcProfile";
import { CalcProfileCompileError, explainCompiledSlot } from "./types";

describe("compileCalcProfile", () => {
  it("assigns garden-fee strata 1–4 (Plot→Patch→Garden chain)", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

    expect(
      profile.slots["#/definitions/Plot/properties/billable_area"]?.stratum,
    ).toBe(1);
    expect(
      profile.slots["#/definitions/Patch/properties/billable_area_total"]
        ?.stratum,
    ).toBe(2);
    expect(
      profile.slots["#/definitions/Garden/properties/total_billable"]?.stratum,
    ).toBe(3);
    expect(
      profile.slots["#/definitions/Garden/properties/annual_fee"]?.stratum,
    ).toBe(4);
  });

  it("precomputes reverse dependents adjacency", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const plotSlot =
      profile.slots["#/definitions/Plot/properties/billable_area"]!;
    expect(plotSlot.dependents).toContain(
      "#/definitions/Patch/properties/billable_area_total",
    );

    const patchSlot =
      profile.slots["#/definitions/Patch/properties/billable_area_total"]!;
    expect(patchSlot.dependents).toContain(
      "#/definitions/Garden/properties/total_billable",
    );
  });

  it("explainCompiledSlot prints strata chain", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const text = explainCompiledSlot(
      profile,
      "#/definitions/Garden/properties/annual_fee",
    );
    expect(text).toContain("Stratum: 4");
    expect(text).toContain("Formula: total_billable * fee_rate_per_sqm");
  });

  it("detects cycles with named chain in error", () => {
    const cyclicSidecar = {
      ...gardenFeeSidecar,
      slots: {
        ...gardenFeeSidecar.slots,
        "#/definitions/Garden/properties/total_billable": {
          formula: "annual_fee",
        },
        "#/definitions/Garden/properties/annual_fee": {
          formula: "total_billable * fee_rate_per_sqm",
        },
      },
    };

    expect(() => compileCalcProfile(cyclicSidecar, gardenFeeSchema)).toThrow(
      CalcProfileCompileError,
    );
    try {
      compileCalcProfile(cyclicSidecar, gardenFeeSchema);
    } catch (e) {
      expect(e).toBeInstanceOf(CalcProfileCompileError);
      const err = e as CalcProfileCompileError;
      expect(err.issues.some((i) => i.kind === "cycle")).toBe(true);
    }
  });

  it("rejects auth-boundary violations with fix hint", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    expect(profile.schemaIdentity.fingerprint).toMatch(/^sha256-/);

    expect(() =>
      compileCalcProfile(gardenFeeSidecar, gardenFeeSchema, {
        authRuleScopes: ["#/definitions/Garden/properties/total_billable"],
      }),
    ).toThrow(CalcProfileCompileError);

    try {
      compileCalcProfile(gardenFeeSidecar, gardenFeeSchema, {
        authRuleScopes: ["#/definitions/Garden/properties/total_billable"],
      });
    } catch (e) {
      const err = e as CalcProfileCompileError;
      const violation = err.issues.find(
        (i) => i.kind === "auth-boundary-violation",
      );
      expect(violation).toBeDefined();
      expect(violation?.message).toContain("auth boundary");
      expect(violation?.message).toContain("Fix:");
    }
  });

  it("validates binding paths against schema", () => {
    const badSidecar = {
      ...gardenFeeSidecar,
      slots: {
        ...gardenFeeSidecar.slots,
        "#/definitions/Plot/properties/billable_area": {
          formula: "unknown_field * length_m",
        },
      },
    };

    expect(() => compileCalcProfile(badSidecar, gardenFeeSchema)).toThrow(
      CalcProfileCompileError,
    );
  });
});

describe("garden-fee fixture sanity", () => {
  it("sample data has no precomputed fields", () => {
    expect(gardenFeeSampleData.patch.plots[0]).not.toHaveProperty(
      "billable_area",
    );
    expect(gardenFeeExpected.plotBillable).toEqual([20, 18]);
  });
});
