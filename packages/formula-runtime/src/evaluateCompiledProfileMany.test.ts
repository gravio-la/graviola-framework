import { describe, expect, it } from "bun:test";
import {
  gardenFeeExpected,
  gardenFeeSampleData,
  gardenFeeSchema,
  gardenFeeSidecar,
} from "@graviola/calc-fixtures";
import { compileCalcProfile } from "@graviola/formula-dependency";
import { evaluateCompiledProfileMany } from "./evaluateCompiledProfileMany";
import { evaluateCompiledProfileDeterministic } from "./evaluateCompiledProfile";

describe("evaluateCompiledProfileMany", () => {
  const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);

  it("matches single-doc evaluation for a batch", () => {
    const south = {
      ...gardenFeeSampleData,
      "@id": "https://example.org/garden/2",
      name: "South",
      fee_rate_per_sqm: 3,
    };
    const { rows } = evaluateCompiledProfileMany(profile, [
      gardenFeeSampleData,
      south,
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.annual_fee).toBe(gardenFeeExpected.gardenAnnualFee);
    const single = evaluateCompiledProfileDeterministic(profile, south);
    expect(rows[1]!.annual_fee).toBe(single.annual_fee);
  });

  it("reports incomplete aggregates when collection is missing", () => {
    const incompleteDoc = {
      "@id": "https://example.org/garden/3",
      "@type": "Garden",
      fee_rate_per_sqm: 2,
      patch: {
        "@id": "https://example.org/patch/3",
        "@type": "Patch",
        // plots missing
      },
    };
    const { incomplete } = evaluateCompiledProfileMany(
      profile,
      [incompleteDoc],
      { report: true },
    );
    expect(incomplete["https://example.org/garden/3"]).toContain(
      "#/definitions/Patch/properties/billable_area_total",
    );
  });

  it("honours static cache on second evaluation", () => {
    const cache = new Map<string, unknown>();
    const scoped = {
      ...profile,
      slots: Object.fromEntries(
        Object.entries(profile.slots).map(([scope, slot]) => [
          scope,
          { ...slot, cache: "static" },
        ]),
      ),
    };
    const first = evaluateCompiledProfileMany(scoped, [gardenFeeSampleData], {
      cache,
    });
    expect(cache.size).toBeGreaterThan(0);
    const second = evaluateCompiledProfileMany(scoped, [gardenFeeSampleData], {
      cache,
    });
    expect(second.rows[0]!.annual_fee).toBe(first.rows[0]!.annual_fee);
  });
});
