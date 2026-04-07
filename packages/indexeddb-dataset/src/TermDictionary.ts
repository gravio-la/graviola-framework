/**
 * TermDictionary — bidirectional RDF term ↔ integer ID mapping backed by IndexedDB.
 *
 * Architecture:
 *   Object store "terms" with:
 *     keyPath: "id"  (autoIncrement: true)
 *     index "by_term" on "term" field (unique: true)
 *
 *   Each record: { id: number, term: string }
 *
 * Why autoincrement integers (not hashing):
 *   IndexedDB already implements a highly optimized B-tree for integer lookups.
 *   Hashing adds collision complexity with no performance benefit — the dictionary
 *   IS the hash map, implemented by the browser engine in native code.
 *
 * The "term" string uses canonical N-Triples serialization (see serialization.ts).
 */

import type { IDBPDatabase, IDBPTransaction } from "idb";
import type { Term } from "@rdfjs/types";
import { stringToTerm, termToString } from "./serialization";
import { TERMS_BY_TERM_INDEX, TERMS_STORE, type TermRecord } from "./types";

/** Transaction mode that allows both reading and writing */
type ReadWriteTx = IDBPTransaction<
  IDBHexastoreSchema,
  (typeof TERMS_STORE)[],
  "readwrite"
>;

/** Transaction mode for read-only access */
type ReadOnlyTx = IDBPTransaction<
  IDBHexastoreSchema,
  (typeof TERMS_STORE)[],
  "readonly"
>;

/**
 * Typed schema for the idb library's generic type parameter.
 * This tells TypeScript the shape of our object stores.
 */
export interface IDBHexastoreSchema {
  terms: {
    key: number;
    value: TermRecord;
    indexes: {
      by_term: string;
    };
  };
  spo: {
    key: number[];
    value: never;
  };
  ops: {
    key: number[];
    value: never;
  };
  pso: {
    key: number[];
    value: never;
  };
}

export class TermDictionary {
  /** In-memory cache: term string → ID (populated on lookup/insert) */
  private termToId = new Map<string, number>();
  /** In-memory cache: ID → term string */
  private idToTerm = new Map<number, string>();

  constructor(private readonly db: IDBPDatabase<IDBHexastoreSchema>) {}

  /**
   * Get the integer ID for an RDF term, creating it if it doesn't exist.
   * Must be called within a readwrite transaction on the "terms" store.
   */
  async getOrCreateId(term: Term, tx: ReadWriteTx): Promise<number> {
    const termStr = termToString(term);

    // Check in-memory cache first
    const cached = this.termToId.get(termStr);
    if (cached !== undefined) {
      return cached;
    }

    const store = tx.objectStore(TERMS_STORE);

    // Check if already in IndexedDB
    const existing = await store.index(TERMS_BY_TERM_INDEX).get(termStr);
    if (existing !== undefined) {
      this.termToId.set(termStr, existing.id);
      this.idToTerm.set(existing.id, termStr);
      return existing.id;
    }

    // Create new entry — autoIncrement provides the id
    const newRecord: Omit<TermRecord, "id"> & { id?: number } = {
      term: termStr,
    };
    const newId = (await store.add(newRecord as TermRecord)) as number;
    this.termToId.set(termStr, newId);
    this.idToTerm.set(newId, termStr);
    return newId;
  }

  /**
   * Look up the integer ID for an RDF term without creating it.
   * Returns undefined if the term is not in the dictionary.
   * Can be called with either a readonly or readwrite transaction.
   */
  async getId(term: Term): Promise<number | undefined> {
    const termStr = termToString(term);
    const cached = this.termToId.get(termStr);
    if (cached !== undefined) {
      return cached;
    }

    const record = await this.db
      .transaction(TERMS_STORE, "readonly")
      .objectStore(TERMS_STORE)
      .index(TERMS_BY_TERM_INDEX)
      .get(termStr);

    if (record !== undefined) {
      this.termToId.set(termStr, record.id);
      this.idToTerm.set(record.id, termStr);
      return record.id;
    }
    return undefined;
  }

  /**
   * Resolve an integer ID back to an RDF term.
   * Throws if the ID is not found (should never happen if the DB is consistent).
   */
  async resolveTerm(id: number): Promise<Term> {
    // Check in-memory cache first
    const cached = this.idToTerm.get(id);
    if (cached !== undefined) {
      return stringToTerm(cached);
    }

    const record = await this.db
      .transaction(TERMS_STORE, "readonly")
      .objectStore(TERMS_STORE)
      .get(id);

    if (record === undefined) {
      throw new Error(`TermDictionary: unknown term ID ${id}`);
    }

    this.termToId.set(record.term, id);
    this.idToTerm.set(id, record.term);
    return stringToTerm(record.term);
  }

  /**
   * Warm the in-memory cache for a set of IDs.
   * Useful before iterating over a large result set to batch the ID lookups.
   */
  async warmCache(ids: number[]): Promise<void> {
    const missing = ids.filter((id) => !this.idToTerm.has(id));
    if (missing.length === 0) return;

    const tx = this.db.transaction(TERMS_STORE, "readonly");
    const store = tx.objectStore(TERMS_STORE);
    await Promise.all(
      missing.map(async (id) => {
        const record = await store.get(id);
        if (record) {
          this.termToId.set(record.term, id);
          this.idToTerm.set(id, record.term);
        }
      }),
    );
  }

  /** Clear the in-memory cache (useful after bulk operations) */
  clearCache(): void {
    this.termToId.clear();
    this.idToTerm.clear();
  }
}
