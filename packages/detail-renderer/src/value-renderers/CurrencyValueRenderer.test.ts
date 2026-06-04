import { describe, expect, it } from "bun:test";

import { formatCurrencyValue } from "./CurrencyValueRenderer";

describe("formatCurrencyValue", () => {
  it("formats integer cents when unit is minor", () => {
    const s = formatCurrencyValue(1299, {
      currency: "EUR",
      unit: "minor",
      locale: "de-DE",
    });
    expect(s).toContain("12,99");
    expect(s).toMatch(/€|EUR/);
  });

  it("formats major unit amounts", () => {
    const s = formatCurrencyValue(12.5, {
      currency: "USD",
      locale: "en-US",
    });
    expect(s).toContain("12.50");
  });

  it("returns stringified value when currency missing", () => {
    expect(formatCurrencyValue(100, {})).toBe("100");
  });
});
