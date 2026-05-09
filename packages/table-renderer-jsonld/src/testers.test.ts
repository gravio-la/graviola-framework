import { describe, expect, test } from "bun:test";
import { jsonLdColumnRegistry } from "./index";

describe("jsonld renderer registry", () => {
  test("starts with empty registry placeholder", () => {
    expect(Array.isArray(jsonLdColumnRegistry)).toBe(true);
  });
});
