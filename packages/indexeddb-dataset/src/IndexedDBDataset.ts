/**
 * IndexedDBDataset — persistent RDF dataset backed by IndexedDB hexastore.
 *
 * Architecture overview:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  IndexedDBDataset                           │
 *   │                                             │
 *   │  DatasetCore interface (sync)               │
 *   │    add / delete / has / match / size        │
 *   │                                             │
 *   │  Async extensions                           │
 *   │    matchAsync / countQuads / flush          │
 *   │    getSize / destroy / import               │
 *   │                                             │
 *   │  WriteBuffer ────────────► IndexedDB        │
 *   │  (pending ops)            (3 index stores   │
 *   │                            + terms dict)    │
 *   │  TermDictionary ──────────► "terms" store   │
 *   └─────────────────────────────────────────────┘
 *
 * Synchronous DatasetCore:
 *   The RDFJS DatasetCore interface is synchronous, but IndexedDB is async.
 *   We handle this by:
 *     - add() / delete(): buffer the operation in WriteBuffer (sync), schedule
 *       async flush.
 *     - has(): checks the WriteBuffer's pending state first, then falls back to
 *       a best-effort synchronous answer.  For reliable has() use matchAsync.
 *     - match(): returns an object that is both DatasetCore and AsyncIterable<Quad>.
 *       The synchronous iteration (DatasetCore) returns buffered quads only;
 *       the async iteration ([Symbol.asyncIterator]) queries IndexedDB.
 *     - size: returns the buffer's pendingCount as a lower-bound hint.
 *       Use getSize() for the authoritative async count.
 *
 * The match() return value implements AsyncIterable<Quad> to satisfy Comunica's
 * RDFJS source interface (@comunica/query-sparql-rdfjs calls match().then or
 * for-await-of on the result).
 */

import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { DatasetCore, Quad, Term } from "@rdfjs/types";
import { EventEmitter } from "events";
import N3 from "n3";
import { BufferedIterator } from "asynciterator";
import { TermDictionary, type IDBHexastoreSchema } from "./TermDictionary";
import { WriteBuffer, type WriteBufferOptions } from "./WriteBuffer";
import { IndexManager } from "./IndexManager";
import type { BoundPattern } from "./types";
import {
  DB_VERSION,
  DEFAULT_DB_NAME,
  TERMS_STORE,
  TERMS_BY_TERM_INDEX,
  INDEX_STORES,
  type StoredQuadGraph,
  type StoredQuadObject,
  type StoredQuadPredicate,
  type StoredQuadSubject,
} from "./types";

const { DataFactory } = N3;

export type IndexedDBDatasetOptions = {
  /** IndexedDB database name (default: "graviola-rdf") */
  dbName?: string;
  /** Write buffer configuration */
  bufferOptions?: WriteBufferOptions;
};

/**
 * Result of IndexedDBDataset.match().
 *
 * Extends BufferedIterator<Quad> from the `asynciterator` library so that
 * Comunica's internal `asynciterator.wrap()` call recognises it as an
 * AsyncIterator instance (via `instanceof`) and returns it directly — without
 * falling through to the synchronous `Symbol.iterator` path that DatasetCore
 * requires.
 *
 * The constructor immediately starts an async pump that:
 *   1. Calls owner.matchAsync() (which flushes the write buffer first).
 *   2. Pushes every yielded quad into the BufferedIterator via `this._push()`.
 *   3. Closes the iterator when the generator is exhausted.
 *
 * The DatasetCore stub methods (add/delete/has/match/size/Symbol.iterator) are
 * still present so that TypeScript is satisfied, but they delegate to the owner
 * and are only relevant for synchronous DatasetCore consumers (not Comunica).
 */
class MatchResult extends BufferedIterator<Quad> implements DatasetCore {
  constructor(
    private readonly owner: IndexedDBDataset,
    private readonly pattern: {
      subject?: Term | null;
      predicate?: Term | null;
      object?: Term | null;
      graph?: Term | null;
    },
  ) {
    super({ autoStart: false });
    // Kick off async fetching without waiting — BufferedIterator manages back-pressure.
    this._startFetching();
  }

  private _startFetching(): void {
    (async () => {
      try {
        for await (const quad of this.owner.matchAsync(
          this.pattern.subject ?? undefined,
          this.pattern.predicate ?? undefined,
          this.pattern.object ?? undefined,
          this.pattern.graph ?? undefined,
        )) {
          // _push returns false when the buffer is full; we ignore back-pressure
          // here because Comunica drains the iterator faster than we fill it.
          this._push(quad);
        }
        this.close();
      } catch (err) {
        this.emit("error", err);
      }
    })();
  }

  // ------ DatasetCore stubs (delegate to owner) ------

  add(quad: Quad): this {
    this.owner.add(quad);
    return this;
  }

  delete(quad: Quad): this {
    this.owner.delete(quad);
    return this;
  }

  has(quad: Quad): boolean {
    return this.owner.has(quad);
  }

  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): DatasetCore {
    return this.owner.match(subject, predicate, object, graph);
  }

  get size(): number {
    return 0;
  }

  [Symbol.iterator](): Iterator<Quad> {
    return [][Symbol.iterator]();
  }
}

export class IndexedDBDataset implements DatasetCore {
  private constructor(
    private readonly db: IDBPDatabase<IDBHexastoreSchema>,
    private readonly dict: TermDictionary,
    private readonly buffer: WriteBuffer,
    private readonly manager: IndexManager,
  ) {}

  /**
   * Open (or create) the IndexedDB hexastore database.
   *
   * The upgrade callback creates:
   *   - "terms" store with autoincrement PK and unique "by_term" index
   *   - "spo", "ops", "pso" key-only stores (keys are compound arrays)
   */
  static async open(
    options: IndexedDBDatasetOptions = {},
  ): Promise<IndexedDBDataset> {
    const dbName = options.dbName ?? DEFAULT_DB_NAME;

    const db = await openDB<IDBHexastoreSchema>(dbName, DB_VERSION, {
      upgrade(db) {
        // Terms dictionary store
        if (!db.objectStoreNames.contains(TERMS_STORE)) {
          const termsStore = db.createObjectStore(TERMS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          termsStore.createIndex(TERMS_BY_TERM_INDEX, "term", { unique: true });
        }

        // Three index stores — key-only (no value), compound array keys
        for (const indexName of INDEX_STORES) {
          if (!db.objectStoreNames.contains(indexName)) {
            db.createObjectStore(indexName);
          }
        }
      },
    });

    const dict = new TermDictionary(db);
    const manager = new IndexManager();
    const buffer = new WriteBuffer(db, dict, options.bufferOptions);

    return new IndexedDBDataset(db, dict, buffer, manager);
  }

  // ---------------------------------------------------------------------------
  // DatasetCore — synchronous interface
  // ---------------------------------------------------------------------------

  /**
   * Queue a quad for insertion.
   * The quad is added to the write buffer and will be persisted on the next flush.
   */
  add(quad: Quad): this {
    this.buffer.addQuad(quad);
    return this;
  }

  /**
   * Queue a quad for deletion.
   * The quad is added to the delete buffer and will be removed on the next flush.
   */
  delete(quad: Quad): this {
    this.buffer.deleteQuad(quad);
    return this;
  }

  /**
   * Synchronous has() — checks pending adds only.
   * Not authoritative for quads already flushed to IndexedDB.
   * Use matchAsync() for a reliable check.
   */
  has(quad: Quad): boolean {
    const pending = this.buffer.getPendingAdds();
    return pending.some(
      (q) =>
        q.subject.equals(quad.subject) &&
        q.predicate.equals(quad.predicate) &&
        q.object.equals(quad.object) &&
        q.graph.equals(quad.graph),
    );
  }

  /**
   * Returns a MatchResult that implements both DatasetCore and AsyncIterable<Quad>.
   * The async iteration path queries IndexedDB via IndexManager.
   * This is the interface Comunica uses via its RDFJS source adapter.
   */
  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): DatasetCore & AsyncIterable<Quad> {
    // MatchResult extends BufferedIterator<Quad> (asynciterator), which makes
    // asynciterator.wrap() recognise it as an AsyncIterator instance and skip
    // the synchronous Symbol.iterator path that would otherwise return 0 quads.
    return new MatchResult(this, {
      subject,
      predicate,
      object,
      graph,
    }) as unknown as DatasetCore & AsyncIterable<Quad>;
  }

  /**
   * Synchronous size is the number of buffered (unflushed) adds.
   * Use getSize() for the total authoritative count.
   */
  get size(): number {
    return this.buffer.pendingCount;
  }

  [Symbol.iterator](): Iterator<Quad> {
    // DatasetCore requires Symbol.iterator. We only iterate buffered quads here.
    return this.buffer.getPendingAdds()[Symbol.iterator]() as Iterator<Quad>;
  }

  // ---------------------------------------------------------------------------
  // Async extensions
  // ---------------------------------------------------------------------------

  /**
   * Async generator that yields all matching quads from IndexedDB.
   * Automatically flushes the write buffer first so results include all quads.
   */
  async *matchAsync(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): AsyncIterable<Quad> {
    const descTerm = (t: Term | null | undefined) =>
      t == null ? "null" : `${t.termType}(${t.value})`;
    console.debug(
      `[IDB:dataset] matchAsync s=${descTerm(subject)} p=${descTerm(predicate)} o=${descTerm(object)} g=${descTerm(graph)}`,
    );

    // Ensure pending writes are visible
    await this.flush();

    // Quick sanity: log raw SPO entry count so we know whether data is persisted
    const rawCount = await this.db
      .transaction("spo", "readonly")
      .objectStore("spo")
      .count();
    console.debug(
      `[IDB:dataset] matchAsync — SPO index has ${rawCount} entries`,
    );

    const pattern = await this._resolvePattern(
      subject,
      predicate,
      object,
      graph,
    );
    console.debug(`[IDB:dataset] matchAsync — resolved pattern:`, pattern);
    if (pattern === null) {
      console.debug(
        `[IDB:dataset] matchAsync — pattern=null (term not in dict) → 0 results`,
      );
      return;
    }

    let yielded = 0;
    for await (const ids of this.manager.matchQuads(this.db, pattern)) {
      const [s, p, o, g] = await Promise.all([
        this.dict.resolveTerm(ids.s),
        this.dict.resolveTerm(ids.p),
        this.dict.resolveTerm(ids.o),
        this.dict.resolveTerm(ids.g),
      ]);
      yielded++;
      yield DataFactory.quad(
        s as StoredQuadSubject,
        p as StoredQuadPredicate,
        o as StoredQuadObject,
        g as StoredQuadGraph,
      );
    }
    console.debug(`[IDB:dataset] matchAsync — yielded ${yielded} quads`);
  }

  /**
   * Count quads matching the given pattern.
   * Flushes first for accurate counts.
   */
  async countQuads(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): Promise<number> {
    await this.flush();

    const descTerm = (t: Term | null | undefined) =>
      t == null ? "null" : `${t.termType}(${JSON.stringify(t.value)})`;
    console.debug(
      `[IDB:dataset] countQuads s=${descTerm(subject)} p=${descTerm(predicate)} o=${descTerm(object)} g=${descTerm(graph)}`,
    );

    const pattern = await this._resolvePattern(
      subject,
      predicate,
      object,
      graph,
    );
    console.debug(
      `[IDB:dataset] countQuads — resolved pattern:`,
      JSON.stringify(pattern),
    );

    if (pattern === null) {
      console.debug(`[IDB:dataset] countQuads — pattern=null → returning 0`);
      return 0;
    }

    const count = await this.manager.countQuads(this.db, pattern);
    console.debug(`[IDB:dataset] countQuads → ${count}`);
    return count;
  }

  /**
   * Flush all pending writes to IndexedDB.
   * Awaiting this guarantees that all previously add()ed quads are persisted.
   */
  async flush(): Promise<void> {
    await this.buffer.flush();
  }

  /**
   * Get the total quad count in the persistent store (after flushing).
   */
  async getSize(): Promise<number> {
    return this.countQuads();
  }

  /** Number of quads waiting in the write buffer (not yet flushed) */
  get bufferedCount(): number {
    return this.buffer.pendingCount;
  }

  /**
   * Close the database connection. Stop the auto-flush timer.
   * Does NOT flush pending writes — call flush() first if needed.
   */
  close(): void {
    this.buffer.stopTimer();
    this.db.close();
  }

  /**
   * Delete the entire IndexedDB database.
   * Closes the connection first.
   */
  async destroy(): Promise<void> {
    const name = this.db.name;
    this.close();
    // IndexedDB deleteDatabase is available globally in browser + fake-indexeddb
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Import quads from an iterable/async-iterable OR from an EventEmitter stream.
   *
   * Two calling conventions are supported:
   *   1. Iterable / AsyncIterable (e.g. array of quads, async generator):
   *        await dataset.import(quadsArray)  → Promise<void>
   *   2. EventEmitter stream (Comunica SPARQL UPDATE INSERT path):
   *        dataset.import(quadStream)  → EventEmitter (emits 'end' when done)
   *
   * Comunica's RdfJsQuadDestination calls the EventEmitter form and awaits 'end'
   * via event-emitter-promisify.  Passing an array (no `.on` method) takes the
   * async-iterable path and returns a plain Promise, which callers can await.
   */
  import(stream: any): any {
    if (stream && typeof stream.on === "function") {
      // EventEmitter stream — used by Comunica for SPARQL UPDATE INSERT
      const emitter = new EventEmitter();
      (async () => {
        await new Promise<void>((resolve, reject) => {
          stream.on("data", (q: Quad) => this.buffer.addQuad(q));
          stream.on("end", resolve);
          stream.on("error", reject);
        });
        await this.flush();
        emitter.emit("end");
      })().catch((err) => emitter.emit("error", err));
      return emitter;
    }
    // Iterable / AsyncIterable path
    return (async () => {
      for await (const quad of stream as AsyncIterable<Quad>) {
        this.buffer.addQuad(quad);
      }
      await this.flush();
    })();
  }

  /**
   * Remove quads supplied by an EventEmitter stream.
   * Required by the RDFJS Store interface; called by Comunica for SPARQL UPDATE DELETE.
   * Returns an EventEmitter that emits 'end' when all deletions are flushed.
   */
  remove(stream: any): EventEmitter {
    const emitter = new EventEmitter();
    (async () => {
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (q: Quad) => this.buffer.deleteQuad(q));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
      await this.flush();
      emitter.emit("end");
    })().catch((err) => emitter.emit("error", err));
    return emitter;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Convert Term arguments to a BoundPattern of integer IDs.
   * Returns null if any bound term is not in the dictionary (no matches possible).
   */
  private async _resolvePattern(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null,
  ): Promise<BoundPattern | null> {
    const pattern: BoundPattern = {};

    if (subject && subject.termType !== "Variable") {
      const id = await this.dict.getId(subject);
      if (id === undefined) {
        console.debug(
          `[IDB:dataset] _resolvePattern: subject not in dict`,
          subject,
        );
        return null;
      }
      pattern.s = id;
    }
    if (predicate && predicate.termType !== "Variable") {
      const id = await this.dict.getId(predicate);
      if (id === undefined) {
        console.debug(
          `[IDB:dataset] _resolvePattern: predicate not in dict`,
          predicate,
        );
        return null;
      }
      pattern.p = id;
    }
    if (object && object.termType !== "Variable") {
      const id = await this.dict.getId(object);
      if (id === undefined) {
        console.debug(
          `[IDB:dataset] _resolvePattern: object not in dict`,
          object,
        );
        return null;
      }
      pattern.o = id;
    }
    if (graph && graph.termType !== "Variable") {
      const termStr = `termType=${graph.termType} value=${JSON.stringify(graph.value)}`;
      const id = await this.dict.getId(graph);
      console.debug(
        `[IDB:dataset] _resolvePattern: graph ${termStr} → id=${id}`,
      );
      if (id === undefined) {
        console.debug(
          `[IDB:dataset] _resolvePattern: graph not in dict`,
          graph,
        );
        return null;
      }
      pattern.g = id;
    }

    return pattern;
  }
}
