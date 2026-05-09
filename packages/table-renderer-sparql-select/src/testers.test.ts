import { describe, expect, test } from "bun:test";
import { primitiveStringEntry } from "./index";

describe("sparql renderer registry", () => {
  test("exposes primitive string entry", () => {
    expect(primitiveStringEntry).toBeDefined();
  });
});
