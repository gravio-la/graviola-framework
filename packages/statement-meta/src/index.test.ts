import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  applyStatementWrites,
  compactStatementNodeForPersistence,
  dedupeStatementNodes,
  extendStatementSchema,
  flattenStatementSchemaProfile,
  remapStatementsForPersistence,
  remapStatementsFromPersistence,
  resolveStatementPolicy,
  statementsForPath,
  stripClientStatements,
} from "./index";

describe("resolveStatementPolicy", () => {
  test("defaults to never", () => {
    expect(resolveStatementPolicy(undefined, "Item", "price")).toBe("never");
  });

  test("reads explicit policy", () => {
    expect(
      resolveStatementPolicy({ "Item.price": "always" }, "Item", "price"),
    ).toBe("always");
  });
});

describe("applyStatementWrites", () => {
  test("sets truthy and appends statement", () => {
    const doc = applyStatementWrites({ name: "x" }, [
      {
        path: "price",
        value: 42,
        statement: { rank: "normal", source: "test" },
      },
    ]);
    expect(doc.price).toBe(42);
    expect(doc["price$stmt"]).toHaveLength(1);
    expect(doc["price$stmt"]?.[0]?.value).toBe(42);
    expect(doc["price$stmt"]?.[0]?.source).toBe("test");
  });

  test("same value replaces statement metadata", () => {
    const first = applyStatementWrites({}, [
      { path: "price", value: 10, statement: { source: "a" } },
    ]);
    const second = applyStatementWrites(first, [
      { path: "price", value: 10, statement: { source: "b" } },
    ]);
    expect(second["price$stmt"]).toHaveLength(1);
    expect(second["price$stmt"]?.[0]?.source).toBe("b");
  });

  test("two values accumulate", () => {
    const doc = applyStatementWrites(
      applyStatementWrites({}, [
        { path: "price", value: 10, statement: { source: "a" } },
      ]),
      [{ path: "price", value: 20, statement: { source: "b" } }],
    );
    expect(doc["price$stmt"]).toHaveLength(2);
    expect(doc.price).toBe(20);
  });

  test("missing intermediate throws", () => {
    expect(() =>
      applyStatementWrites({}, [
        { path: "billing.total", value: 1, statement: {} },
      ]),
    ).toThrow(/does not exist/);
  });
});

describe("dedupeStatementNodes", () => {
  test("collapses join duplicates by value hash (last wins)", () => {
    const nodes = dedupeStatementNodes([
      { value: 10, source: "old" },
      { value: 20, source: "a" },
      { value: 10, source: "new" },
      { value: 20, source: "b" },
    ]);
    expect(nodes).toHaveLength(2);
    expect(nodes.find((n) => n.value === 10)?.source).toBe("new");
    expect(nodes.find((n) => n.value === 20)?.source).toBe("b");
  });

  test("keeps the latest generatedAt per value regardless of array order", () => {
    const nodes = dedupeStatementNodes([
      {
        value: 10,
        source: "restored",
        generatedAt: "2026-03-03T00:00:00.000Z",
      },
      { value: 20, source: "b", generatedAt: "2026-03-02T00:00:00.000Z" },
      {
        value: 10,
        source: "original",
        generatedAt: "2026-03-01T00:00:00.000Z",
      },
    ]);
    expect(nodes).toHaveLength(2);
    expect(nodes.find((n) => n.value === 10)?.source).toBe("restored");
  });
});

describe("compactStatementNodeForPersistence", () => {
  test("drops nested generatedAt when it matches the node timestamp", () => {
    const compact = compactStatementNodeForPersistence({
      value: 1,
      generatedAt: "2026-03-01T10:00:00.000Z",
      wasGeneratedBy: {
        formulaId: "f",
        generatedAt: "2026-03-01T10:00:00.000Z",
      },
    });
    expect(compact.generatedAt).toBe("2026-03-01T10:00:00.000Z");
    expect(compact.wasGeneratedBy?.generatedAt).toBeUndefined();
    expect(compact.wasGeneratedBy?.formulaId).toBe("f");
  });
});

describe("remap and strip", () => {
  test("round-trip persistence keys", () => {
    const doc = { price__stmt: [{ value: 1 }] };
    const api = remapStatementsFromPersistence(doc);
    expect(api).toEqual({ price$stmt: [{ value: 1 }] });
    expect(remapStatementsForPersistence(api)).toEqual(doc);
  });

  test("strip removes both suffix forms", () => {
    const doc = {
      price$stmt: [{ value: 1 }],
      nested: { tax__stmt: [{ value: 2 }] },
    };
    expect(stripClientStatements(doc)).toEqual({ nested: {} });
  });
});

describe("statementsForPath", () => {
  test("top-level path", () => {
    const doc = { price$stmt: [{ value: 1, rank: "normal" }] };
    expect(statementsForPath(doc, "price")).toHaveLength(1);
  });

  test("nested path", () => {
    const doc = {
      billing: { total$stmt: [{ value: 99 }] },
    };
    expect(statementsForPath(doc, "billing.total")[0]?.value).toBe(99);
  });

  test("path through array concatenates", () => {
    const doc = {
      lines: [{ amount$stmt: [{ value: 1 }] }, { amount$stmt: [{ value: 2 }] }],
    };
    expect(statementsForPath(doc, "lines.amount")).toHaveLength(2);
  });

  test("absent path returns empty", () => {
    expect(statementsForPath({}, "missing")).toEqual([]);
  });
});

describe("extendStatementSchema", () => {
  test("merges extension properties", () => {
    const base: JSONSchema7 = {
      type: "object",
      properties: { value: { type: "string" } },
    };
    const ext: JSONSchema7 = {
      type: "object",
      properties: {
        importBatch: { type: "string", description: "gra:importBatch" },
      },
    };
    const merged = flattenStatementSchemaProfile(
      extendStatementSchema(base, ext),
    );
    expect(merged.properties?.importBatch).toBeDefined();
  });
});
