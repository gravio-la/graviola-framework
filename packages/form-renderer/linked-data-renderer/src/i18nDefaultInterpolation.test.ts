import { describe, expect, it } from "bun:test";
import { tWithDefaultInterpolation } from "./i18nDefaultInterpolation";

describe("tWithDefaultInterpolation", () => {
  it("interpolates defaultValue when t returns the template unchanged", () => {
    const t = ((key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key) as Parameters<
      typeof tWithDefaultInterpolation
    >[0];

    expect(
      tWithDefaultInterpolation(
        t,
        "derived default hint",
        "übernommen aus {{source}}",
        {
          source: "Tomaten",
        },
      ),
    ).toBe("übernommen aus Tomaten");
  });
});
