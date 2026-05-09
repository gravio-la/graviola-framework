import { describe, expect, test } from "bun:test";
import { mkJsonLdAccessor } from "./index";

describe("mkJsonLdAccessor", () => {
  test("reads shallow property by scope", () => {
    const getName = mkJsonLdAccessor("#/properties/name");
    expect(getName({ name: "Ada" })).toBe("Ada");
  });
});
