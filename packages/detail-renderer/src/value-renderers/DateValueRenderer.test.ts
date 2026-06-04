import { describe, expect, it } from "bun:test";

import { formatDateTimeValue, formatDateValue } from "./DateValueRenderer";

describe("formatDateTimeValue", () => {
  it("formats ISO date-time with locale instead of literal LLL", () => {
    const s = formatDateTimeValue("2024-06-15T14:30:00.000Z", {
      locale: "de-DE",
    });
    expect(s).not.toBe("LLL");
    expect(s).toContain("2024");
    expect(s).toMatch(/14:30|16:30/);
  });

  it("returns stringified value for invalid input", () => {
    expect(formatDateTimeValue("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateValue", () => {
  it("formats ISO date with locale instead of literal LL", () => {
    const s = formatDateValue("2024-06-15", { locale: "de-DE" });
    expect(s).not.toBe("LL");
    expect(s).toContain("2024");
    expect(s).toContain("15");
  });

  it("returns stringified value for invalid input", () => {
    expect(formatDateValue("not-a-date")).toBe("not-a-date");
  });
});
