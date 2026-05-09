import { describe, expect, test } from "bun:test";
import { primitiveStringEntry } from "./index";

describe("sparql renderer fragments", () => {
  test("primitive renderer entry has renderer function", () => {
    expect(typeof primitiveStringEntry?.columnDef).toBe("function");
  });
});
