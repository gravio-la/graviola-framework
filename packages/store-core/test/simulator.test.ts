import { describe, expect, test } from "bun:test";
import { createExistsFromLoads, createResolvesFromLoads } from "../src/index";

describe("simulators", () => {
  test("exists-from-loads", async () => {
    const loads = {
      loadOne: async (_t: string, iri: string) =>
        iri === "http://ex/a" ? ({ x: 1 } as const) : null,
    };
    const ex = createExistsFromLoads(loads as never);
    expect(await ex.exists("T", "http://ex/a")).toBe(true);
    expect(await ex.exists("T", "http://ex/b")).toBe(false);
  });

  test("resolves-from-loads reads @type", async () => {
    const loads = {
      loadOne: async () =>
        ({
          "@type": ["http://voc/T", "http://voc/U"],
        }) as const,
    };
    const res = createResolvesFromLoads(loads as never, () => "Item");
    expect(await res.resolveTypes("http://ex/e")).toEqual([
      "http://voc/T",
      "http://voc/U",
    ]);
  });
});
