/**
 * Integration tests for IndexedDBDataset.
 *
 * Uses fake-indexeddb/auto to provide an in-memory IndexedDB implementation
 * that behaves identically to the browser engine for our use cases.
 */

import "fake-indexeddb/auto";
import { describe, test, expect } from "bun:test";
import N3 from "n3";
import { IndexedDBDataset } from "./IndexedDBDataset";

const { DataFactory } = N3;
const { namedNode, blankNode, literal, defaultGraph, quad } = DataFactory;

// Give each test its own database to avoid interference
let seq = 0;
function newDbName() {
  return `test-dataset-${++seq}`;
}

// Helpers
const ex = (local: string) => namedNode(`http://example.org/${local}`);
const rdfType = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");

// Collect all quads from AsyncIterable
async function collect(iter: AsyncIterable<any>): Promise<any[]> {
  const result: any[] = [];
  for await (const item of iter) {
    result.push(item);
  }
  return result;
}

describe("IndexedDBDataset", () => {
  describe("open and close", () => {
    test("opens without error", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      expect(ds).toBeDefined();
      ds.close();
    });
  });

  describe("add / flush / matchAsync roundtrip", () => {
    test("a single quad survives add → flush → matchAsync", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      const q = quad(ex("Alice"), rdfType, ex("Person"), defaultGraph());

      ds.add(q);
      await ds.flush();

      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(1);
      expect(results[0].subject.value).toBe("http://example.org/Alice");
      ds.close();
    });

    test("multiple quads survive add → flush → matchAsync", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("Alice"), rdfType, ex("Person"), defaultGraph()));
      ds.add(quad(ex("Bob"), rdfType, ex("Person"), defaultGraph()));
      ds.add(quad(ex("Alice"), ex("knows"), ex("Bob"), defaultGraph()));
      await ds.flush();

      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(3);
      ds.close();
    });

    test("data is not present before flush (only in buffer)", async () => {
      const ds = await IndexedDBDataset.open({
        dbName: newDbName(),
        bufferOptions: { flushIntervalMs: 0 }, // disable auto-flush
      });
      const q = quad(ex("Alice"), rdfType, ex("Person"), defaultGraph());
      ds.add(q);
      expect(ds.bufferedCount).toBe(1);
      ds.close();
    });
  });

  describe("index patterns", () => {
    async function setupDataset() {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      // Three subjects, two predicates, two objects
      ds.add(quad(ex("Alice"), ex("name"), literal("Alice"), defaultGraph()));
      ds.add(quad(ex("Alice"), ex("age"), literal("30"), defaultGraph()));
      ds.add(quad(ex("Bob"), ex("name"), literal("Bob"), defaultGraph()));
      ds.add(quad(ex("Bob"), ex("age"), literal("25"), defaultGraph()));
      ds.add(
        quad(ex("Charlie"), ex("name"), literal("Charlie"), defaultGraph()),
      );
      await ds.flush();
      return ds;
    }

    test("s-only pattern (SPO index)", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync(ex("Alice")));
      expect(results).toHaveLength(2);
      expect(
        results.every(
          (q: any) => q.subject.value === "http://example.org/Alice",
        ),
      ).toBe(true);
      ds.close();
    });

    test("p-only pattern (PSO index)", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync(null, ex("name")));
      expect(results).toHaveLength(3);
      expect(
        results.every(
          (q: any) => q.predicate.value === "http://example.org/name",
        ),
      ).toBe(true);
      ds.close();
    });

    test("o-only pattern (OPS index)", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync(null, null, literal("Bob")));
      expect(results).toHaveLength(1);
      expect(results[0].object.value).toBe("Bob");
      ds.close();
    });

    test("s+p pattern (SPO index, two-key prefix)", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync(ex("Bob"), ex("age")));
      expect(results).toHaveLength(1);
      expect(results[0].object.value).toBe("25");
      ds.close();
    });

    test("s+p+o exact match", async () => {
      const ds = await setupDataset();
      const results = await collect(
        ds.matchAsync(ex("Alice"), ex("name"), literal("Alice")),
      );
      expect(results).toHaveLength(1);
      ds.close();
    });

    test("no pattern (full scan)", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(5);
      ds.close();
    });

    test("unknown term yields empty results", async () => {
      const ds = await setupDataset();
      const results = await collect(ds.matchAsync(ex("Nobody")));
      expect(results).toHaveLength(0);
      ds.close();
    });
  });

  describe("delete", () => {
    test("deleted quad no longer appears in matchAsync", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      const q1 = quad(ex("Alice"), rdfType, ex("Person"), defaultGraph());
      const q2 = quad(ex("Bob"), rdfType, ex("Person"), defaultGraph());
      ds.add(q1);
      ds.add(q2);
      await ds.flush();

      ds.delete(q1);
      await ds.flush();

      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(1);
      expect(results[0].subject.value).toBe("http://example.org/Bob");
      ds.close();
    });

    test("deleting non-existent quad is a no-op", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("Alice"), rdfType, ex("Person"), defaultGraph()));
      await ds.flush();

      ds.delete(quad(ex("Nobody"), rdfType, ex("Person"), defaultGraph()));
      await ds.flush();

      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(1);
      ds.close();
    });
  });

  describe("countQuads", () => {
    test("counts all quads with no pattern", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("a"), ex("p"), ex("b"), defaultGraph()));
      ds.add(quad(ex("a"), ex("p"), ex("c"), defaultGraph()));
      ds.add(quad(ex("d"), ex("p"), ex("e"), defaultGraph()));
      await ds.flush();

      const count = await ds.countQuads();
      expect(count).toBe(3);
      ds.close();
    });

    test("counts quads matching s-only pattern", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("a"), ex("p1"), ex("b"), defaultGraph()));
      ds.add(quad(ex("a"), ex("p2"), ex("c"), defaultGraph()));
      ds.add(quad(ex("d"), ex("p1"), ex("e"), defaultGraph()));
      await ds.flush();

      const count = await ds.countQuads(ex("a"));
      expect(count).toBe(2);
      ds.close();
    });

    test("counts quads matching p-only pattern", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("a"), ex("p1"), ex("b"), defaultGraph()));
      ds.add(quad(ex("a"), ex("p2"), ex("c"), defaultGraph()));
      ds.add(quad(ex("d"), ex("p1"), ex("e"), defaultGraph()));
      await ds.flush();

      const count = await ds.countQuads(null, ex("p1"));
      expect(count).toBe(2);
      ds.close();
    });

    test("returns 0 for unknown term", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("a"), ex("p"), ex("b"), defaultGraph()));
      await ds.flush();

      const count = await ds.countQuads(ex("nobody"));
      expect(count).toBe(0);
      ds.close();
    });
  });

  describe("getSize", () => {
    test("getSize returns total quad count", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("a"), ex("p"), ex("b"), defaultGraph()));
      ds.add(quad(ex("c"), ex("p"), ex("d"), defaultGraph()));
      await ds.flush();

      const size = await ds.getSize();
      expect(size).toBe(2);
      ds.close();
    });
  });

  describe("flush", () => {
    test("explicit flush makes quads queryable", async () => {
      const ds = await IndexedDBDataset.open({
        dbName: newDbName(),
        bufferOptions: { flushIntervalMs: 0, flushThreshold: 10000 },
      });
      ds.add(quad(ex("Alice"), rdfType, ex("Person"), defaultGraph()));

      // Not queryable yet (no flush happened)
      // buffer has it but IndexedDB does not
      expect(ds.bufferedCount).toBe(1);

      await ds.flush();

      expect(ds.bufferedCount).toBe(0);
      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(1);
      ds.close();
    });
  });

  describe("destroy", () => {
    test("destroys the database and subsequent open starts fresh", async () => {
      const dbName = newDbName();
      const ds = await IndexedDBDataset.open({ dbName });
      ds.add(quad(ex("Alice"), rdfType, ex("Person"), defaultGraph()));
      await ds.flush();
      await ds.destroy();

      // Re-open — should be empty
      const ds2 = await IndexedDBDataset.open({ dbName });
      const results = await collect(ds2.matchAsync());
      expect(results).toHaveLength(0);
      ds2.close();
    });
  });

  describe("named graphs", () => {
    test("graph filter returns only quads in that graph", async () => {
      const g1 = namedNode("http://example.org/g1");
      const g2 = namedNode("http://example.org/g2");
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });

      ds.add(quad(ex("Alice"), rdfType, ex("Person"), g1));
      ds.add(quad(ex("Bob"), rdfType, ex("Person"), g2));
      ds.add(quad(ex("Charlie"), rdfType, ex("Person"), g1));
      await ds.flush();

      const g1Results = await collect(ds.matchAsync(null, null, null, g1));
      expect(g1Results).toHaveLength(2);

      const g2Results = await collect(ds.matchAsync(null, null, null, g2));
      expect(g2Results).toHaveLength(1);
      ds.close();
    });
  });

  describe("import", () => {
    test("import from async iterable adds all quads", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      const quads = [
        quad(ex("a"), ex("p"), ex("b"), defaultGraph()),
        quad(ex("c"), ex("p"), ex("d"), defaultGraph()),
        quad(ex("e"), ex("p"), ex("f"), defaultGraph()),
      ];

      async function* makeIterable() {
        for (const q of quads) yield q;
      }

      await ds.import(makeIterable());
      const results = await collect(ds.matchAsync());
      expect(results).toHaveLength(3);
      ds.close();
    });
  });

  describe("match() AsyncIterable interface", () => {
    test("match() result is iterable with for-await-of", async () => {
      const ds = await IndexedDBDataset.open({ dbName: newDbName() });
      ds.add(quad(ex("Alice"), rdfType, ex("Person"), defaultGraph()));
      ds.add(quad(ex("Bob"), rdfType, ex("Person"), defaultGraph()));
      await ds.flush();

      const matchResult = ds.match(null, rdfType);
      const results: any[] = [];
      for await (const q of matchResult as any) {
        results.push(q);
      }
      expect(results).toHaveLength(2);
      ds.close();
    });
  });
});
