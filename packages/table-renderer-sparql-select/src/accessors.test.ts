import { describe, expect, test } from "bun:test";
import { singleValueColumnStub } from "./tableRegistryHelper";

describe("singleValueColumnStub", () => {
  test("builds sparql single value id", () => {
    const stub = singleValueColumnStub([], "name", (v: string) => v);
    expect(stub.id).toBe("name_single");
  });
});
