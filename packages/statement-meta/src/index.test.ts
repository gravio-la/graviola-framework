import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  assertStatementSidecarsPersisted,
  applyStatementRetention,
  applyStatementWrites,
  carryOverStatements,
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

describe("applyStatementRetention", () => {
  test("orders by generatedAt and keeps the requested newest nodes", () => {
    const nodes = applyStatementRetention(
      [
        { value: 30, generatedAt: "2026-03-03T00:00:00.000Z" },
        { value: 10, generatedAt: "2026-03-01T00:00:00.000Z" },
        { value: 20, generatedAt: "2026-03-02T00:00:00.000Z" },
      ],
      { keepLast: 2 },
    );
    expect(nodes.map(({ value }) => value)).toEqual([20, 30]);
  });

  test("uses array order to break timestamp ties", () => {
    const generatedAt = "2026-03-01T00:00:00.000Z";
    const nodes = applyStatementRetention(
      [
        { value: 10, generatedAt },
        { value: 20, generatedAt },
        { value: 30, generatedAt },
      ],
      { keepLast: 2 },
    );
    expect(nodes.map(({ value }) => value)).toEqual([20, 30]);
  });

  test("always keeps the current node", () => {
    const current = {
      value: 30,
      generatedAt: "2026-03-01T00:00:00.000Z",
    };
    const nodes = applyStatementRetention(
      [
        { value: 10, generatedAt: "2026-03-02T00:00:00.000Z" },
        { value: 20 },
        current,
      ],
      "latest",
    );
    expect(nodes).toEqual([current]);
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

describe("carryOverStatements", () => {
  const stored = {
    "@id": "ex:1",
    price: 10,
    price$stmt: [{ value: 10, source: "catalog" }],
    billing: { total: 5, total$stmt: [{ value: 5, source: "invoice" }] },
    tags: [{ name: "a", name$stmt: [{ value: "a" }] }],
  };

  test("stored sidecars are copied onto the next document at the same paths", () => {
    const next = carryOverStatements(
      { "@id": "ex:1", price: 12, billing: { total: 5 }, label: "new" },
      stored,
    );
    expect(next).toEqual({
      "@id": "ex:1",
      price: 12,
      price$stmt: [{ value: 10, source: "catalog" }],
      billing: { total: 5, total$stmt: [{ value: 5, source: "invoice" }] },
      label: "new",
    });
    // Copies, not references into the stored document.
    expect((next as Record<string, unknown>).price$stmt).not.toBe(
      stored.price$stmt,
    );
  });

  test("a nested object missing from the next document is not recreated; arrays are not traversed", () => {
    const next = carryOverStatements(
      { "@id": "ex:1", tags: [{ name: "a" }] },
      stored,
    );
    expect(next).toEqual({
      "@id": "ex:1",
      price$stmt: [{ value: 10, source: "catalog" }],
      tags: [{ name: "a" }],
    });
  });

  test("no previous document: unchanged", () => {
    const doc = { "@id": "ex:1", price: 1 };
    expect(carryOverStatements(doc, null)).toBe(doc);
  });
});

describe("assertStatementSidecarsPersisted", () => {
  const node = (value: number, generated = true) => ({
    value,
    ...(generated ? { wasGeneratedBy: { activity: "calc" } } : {}),
  });

  test("passes when every sidecar node is still there", () => {
    const doc = { "@id": "ex:1", price: 2, price__stmt: [node(1), node(2)] };
    expect(() => assertStatementSidecarsPersisted(doc, doc)).not.toThrow();
  });

  test("does not depend on the order of the nodes", () => {
    const source = { "@id": "ex:1", price__stmt: [node(1), node(2), node(2)] };
    const cleaned = { "@id": "ex:1", price__stmt: [node(2), node(1), node(2)] };
    expect(() =>
      assertStatementSidecarsPersisted(source, cleaned),
    ).not.toThrow();
  });

  test("throws when a nested sidecar was cut off", () => {
    const source = {
      "@id": "ex:1",
      billing: { detail: { net: 1, net__stmt: [node(1)] } },
    };
    const lostNode = { "@id": "ex:1", billing: { detail: { net: 1 } } };
    const lostActivity = {
      "@id": "ex:1",
      billing: { detail: { net: 1, net__stmt: [node(1, false)] } },
    };
    expect(() => assertStatementSidecarsPersisted(source, lostNode)).toThrow(
      /billing\.detail\.net/,
    );
    expect(() =>
      assertStatementSidecarsPersisted(source, lostActivity),
    ).toThrow(/billing\.detail\.net/);
  });

  test("throws when a node is missing among equal-looking ones", () => {
    const source = { "@id": "ex:1", price__stmt: [node(1), node(1)] };
    const cleaned = { "@id": "ex:1", price__stmt: [node(1)] };
    expect(() => assertStatementSidecarsPersisted(source, cleaned)).toThrow();
  });

  test("ignores statements of a linked entity, which is saved as a reference", () => {
    const source = {
      "@id": "ex:membership",
      patch: { "@id": "ex:patch", area: 5, area__stmt: [node(5)] },
    };
    const cleaned = { "@id": "ex:membership", patch: { "@id": "ex:patch" } };
    expect(() =>
      assertStatementSidecarsPersisted(source, cleaned),
    ).not.toThrow();
  });
});
