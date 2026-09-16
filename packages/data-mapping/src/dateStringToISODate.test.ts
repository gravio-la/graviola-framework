import { describe, expect, test } from "bun:test";

import { dateStringToISODate } from "./mappingStrategies";

describe("dateStringToISODate", () => {
  test("parses Wikidata time strings", () => {
    expect(dateStringToISODate("+1881-10-25T00:00:00Z", {})).toBe("1881-10-25");
  });

  test("parses year-only values", () => {
    expect(dateStringToISODate("1881", {})).toBe("1881");
  });

  test("parses dotted dates", () => {
    expect(dateStringToISODate("25.10.1881", {})).toBe("1881-10-25");
  });
});
