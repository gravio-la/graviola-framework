/**
 * Tests for TermDictionary — bidirectional RDF term ↔ integer ID mapping.
 */

import "fake-indexeddb/auto";
import { describe, test, expect, beforeEach } from "bun:test";
import { openDB } from "idb";
import N3 from "n3";
import { TermDictionary } from "./TermDictionary";
import type { IDBHexastoreSchema } from "./TermDictionary";
import {
  DB_VERSION,
  TERMS_STORE,
  TERMS_BY_TERM_INDEX,
  INDEX_STORES,
} from "./types";

const { DataFactory } = N3;
const { namedNode, blankNode, literal, defaultGraph } = DataFactory;

async function openTestDB(name: string) {
  return openDB<IDBHexastoreSchema>(name, DB_VERSION, {
    upgrade(db) {
      const termsStore = db.createObjectStore(TERMS_STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
      termsStore.createIndex(TERMS_BY_TERM_INDEX, "term", { unique: true });
      for (const indexName of INDEX_STORES) {
        db.createObjectStore(indexName);
      }
    },
  });
}

let dbSeq = 0;
function uniqueDbName() {
  return `test-dict-${++dbSeq}`;
}

describe("TermDictionary", () => {
  describe("getOrCreateId / resolveTerm roundtrip", () => {
    test("named node roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = namedNode("http://example.org/foo");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("NamedNode");
      expect(resolved.value).toBe("http://example.org/foo");
    });

    test("blank node roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = blankNode("b0");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("BlankNode");
      expect(resolved.value).toBe("b0");
    });

    test("plain literal roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = literal("hello");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("Literal");
      expect((resolved as any).value).toBe("hello");
    });

    test("language-tagged literal roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = literal("hello", "en");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("Literal");
      expect((resolved as any).language).toBe("en");
    });

    test("typed literal roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = literal(
        "42",
        namedNode("http://www.w3.org/2001/XMLSchema#integer"),
      );

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("Literal");
      expect((resolved as any).datatype.value).toBe(
        "http://www.w3.org/2001/XMLSchema#integer",
      );
    });

    test("default graph roundtrip", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = defaultGraph();

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      const resolved = await dict.resolveTerm(id);
      expect(resolved.termType).toBe("DefaultGraph");
    });
  });

  describe("same term gets same ID", () => {
    test("two insertions of the same named node return identical IDs", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = namedNode("http://example.org/same");

      const tx1 = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id1 = await dict.getOrCreateId(term, tx1 as any);
      await tx1.done;

      const tx2 = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id2 = await dict.getOrCreateId(term, tx2 as any);
      await tx2.done;

      expect(id1).toBe(id2);
    });

    test("in-memory cache returns same ID without hitting DB again", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = namedNode("http://example.org/cached");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id1 = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      // Second lookup uses in-memory cache via getId
      const id2 = await dict.getId(term);
      expect(id2).toBe(id1);
    });
  });

  describe("different terms get different IDs", () => {
    test("two different named nodes get distinct IDs", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id1 = await dict.getOrCreateId(
        namedNode("http://example.org/a"),
        tx as any,
      );
      const id2 = await dict.getOrCreateId(
        namedNode("http://example.org/b"),
        tx as any,
      );
      await tx.done;

      expect(id1).not.toBe(id2);
    });
  });

  describe("getId for unknown term", () => {
    test("returns undefined for a term not in the dictionary", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);

      const id = await dict.getId(namedNode("http://example.org/unknown"));
      expect(id).toBeUndefined();
    });
  });

  describe("warmCache", () => {
    test("populates cache so subsequent getId hits are cache-only", async () => {
      const db = await openTestDB(uniqueDbName());
      const dict = new TermDictionary(db);
      const term = namedNode("http://example.org/warm");

      const tx = db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");
      const id = await dict.getOrCreateId(term, tx as any);
      await tx.done;

      // Clear and rewarm
      dict.clearCache();
      await dict.warmCache([id]);

      const retrieved = await dict.getId(term);
      expect(retrieved).toBe(id);
    });
  });
});
