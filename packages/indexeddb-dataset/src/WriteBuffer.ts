/**
 * WriteBuffer — accumulates pending quad operations and flushes them to
 * IndexedDB in a single readwrite transaction.
 *
 * Design rationale:
 *   IndexedDB transactions are expensive to open. Batching writes reduces the
 *   number of transactions from O(n quads) to O(1) per flush cycle.
 *   The buffer has two flush triggers:
 *     1. Threshold: when pendingAdds + pendingDeletes >= flushThreshold
 *     2. Interval: a periodic timer flushes whatever is queued
 *
 * The auto-flush timer is deliberately short (default 50ms) so that
 * callers who never explicitly flush still see data persisted quickly.
 * Explicit flush() calls are the preferred path for tests and batch imports.
 */

import type { IDBPDatabase } from "idb";
import type { Quad } from "@rdfjs/types";
import type { IDBHexastoreSchema } from "./TermDictionary";
import type { TermDictionary } from "./TermDictionary";
import {
  INDEX_STORES,
  TERMS_STORE,
  DEFAULT_FLUSH_THRESHOLD,
  DEFAULT_FLUSH_INTERVAL_MS,
} from "./types";
import { spoKey, opsKey, psoKey } from "./keyrange";

export type WriteBufferOptions = {
  flushThreshold?: number;
  flushIntervalMs?: number;
};

export class WriteBuffer {
  private pendingAdds: Quad[] = [];
  private pendingDeletes: Quad[] = [];
  private readonly flushThreshold: number;
  private readonly flushIntervalMs: number;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushPromise: Promise<void> | null = null;

  constructor(
    private readonly db: IDBPDatabase<IDBHexastoreSchema>,
    private readonly dict: TermDictionary,
    options: WriteBufferOptions = {},
  ) {
    this.flushThreshold = options.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
    this.flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.startTimer();
  }

  /** Add a quad to the pending-adds queue */
  addQuad(q: Quad): void {
    this.pendingAdds.push(q);
    if (this.pendingCount >= this.flushThreshold) {
      void this.flush();
    }
  }

  /** Add a quad to the pending-deletes queue */
  deleteQuad(q: Quad): void {
    this.pendingDeletes.push(q);
    if (this.pendingCount >= this.flushThreshold) {
      void this.flush();
    }
  }

  /** Total number of operations waiting to be flushed */
  get pendingCount(): number {
    return this.pendingAdds.length + this.pendingDeletes.length;
  }

  /** Returns a snapshot of pending adds (does not drain the buffer) */
  getPendingAdds(): readonly Quad[] {
    return this.pendingAdds;
  }

  /** Returns a snapshot of pending deletes (does not drain the buffer) */
  getPendingDeletes(): readonly Quad[] {
    return this.pendingDeletes;
  }

  /**
   * Flush all pending operations to IndexedDB in a single readwrite transaction.
   *
   * The transaction covers both "terms" and all three index stores so that
   * dictionary entries and index entries are always written atomically.
   *
   * If a flush is already in progress, we wait for it to complete and then
   * run again (to pick up any operations queued during the first flush).
   */
  async flush(): Promise<void> {
    // If a flush is running, chain onto it
    if (this.flushPromise) {
      await this.flushPromise;
      // After the previous flush completes, check if there's still work
      if (this.pendingCount === 0) return;
    }

    const adds = this.pendingAdds.splice(0);
    const deletes = this.pendingDeletes.splice(0);

    if (adds.length === 0 && deletes.length === 0) {
      return;
    }

    this.flushPromise = this._doFlush(adds, deletes).finally(() => {
      this.flushPromise = null;
    });
    await this.flushPromise;
  }

  private async _doFlush(adds: Quad[], deletes: Quad[]): Promise<void> {
    console.debug(
      `[IDB:buffer] _doFlush: +${adds.length} adds, -${deletes.length} deletes`,
    );
    const tx = this.db.transaction([TERMS_STORE, ...INDEX_STORES], "readwrite");

    // Process adds — always creates dictionary entries
    for (const q of adds) {
      const [s, p, o, g] = await Promise.all([
        this.dict.getOrCreateId(q.subject, tx as any),
        this.dict.getOrCreateId(q.predicate, tx as any),
        this.dict.getOrCreateId(q.object, tx as any),
        this.dict.getOrCreateId(q.graph, tx as any),
      ]);
      const spoStore = tx.objectStore("spo");
      const opsStore = tx.objectStore("ops");
      const psoStore = tx.objectStore("pso");
      // put() is idempotent for key-only stores — adding an existing quad is a no-op
      await spoStore.put(undefined as never, spoKey(s, p, o, g));
      await opsStore.put(undefined as never, opsKey(s, p, o, g));
      await psoStore.put(undefined as never, psoKey(s, p, o, g));
    }

    // Process deletes — look up IDs without creating new entries
    for (const q of deletes) {
      const [s, p, o, g] = await Promise.all([
        this.dict.getId(q.subject),
        this.dict.getId(q.predicate),
        this.dict.getId(q.object),
        this.dict.getId(q.graph),
      ]);
      // If any term is not in the dictionary, the quad cannot exist — skip
      if (
        s === undefined ||
        p === undefined ||
        o === undefined ||
        g === undefined
      ) {
        continue;
      }
      const spoStore = tx.objectStore("spo");
      const opsStore = tx.objectStore("ops");
      const psoStore = tx.objectStore("pso");
      await spoStore.delete(spoKey(s, p, o, g));
      await opsStore.delete(opsKey(s, p, o, g));
      await psoStore.delete(psoKey(s, p, o, g));
    }

    await tx.done;
    console.debug(`[IDB:buffer] _doFlush: transaction committed`);
  }

  /** Stop the auto-flush timer (call before closing the database) */
  stopTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private startTimer(): void {
    if (this.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        if (this.pendingCount > 0) {
          void this.flush();
        }
      }, this.flushIntervalMs);
    }
  }
}
