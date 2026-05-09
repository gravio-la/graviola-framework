import { describe, expect, test } from "bun:test";
import { composeTableRegistries } from "./index";

describe("composeTableRegistries", () => {
  test("concats registries in order", () => {
    const first = [{ name: "first", tester: () => 1, renderer: () => ({}) }];
    const second = [{ name: "second", tester: () => 1, renderer: () => ({}) }];
    const merged = composeTableRegistries(first as any, second as any);
    expect(merged.map((e) => e.name)).toEqual(["first", "second"]);
  });
});
