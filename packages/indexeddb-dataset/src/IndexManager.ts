/**
 * IndexManager — reads and writes the three hexastore index stores.
 *
 * Index selection strategy (SPO / PSO / OPS):
 *
 *   Given a BoundPattern {s?, p?, o?, g?} we choose the index whose leading
 *   key component is bound first, because IndexedDB prefix scans are only
 *   efficient over a key *prefix*:
 *
 *     s bound          → SPO (key: [s, p, o, g])  — best prefix
 *     p bound, no s    → PSO (key: [p, s, o, g])
 *     o bound, no s/p  → OPS (key: [o, p, s, g])
 *     none bound       → SPO full scan (no key range)
 *
 *   Graph (g) is always the last key component in every index, so it can only
 *   benefit from an exact match *after* s+p+o are all bound.  For partial g
 *   filtering we do post-scan filtering.
 *
 * Why three indexes instead of six:
 *   The classic Hexastore paper (Weiss et al., VLDB 2008) uses six permutations
 *   to guarantee O(log n) for all query patterns.  We start with three because:
 *     - They cover the dominant patterns in SPARQL: BGP triple patterns where
 *       subject, predicate, or object is the "anchor" term.
 *     - Storage is cut in half.
 *     - In a browser with limited quota, size matters more than covering the
 *       SP→O, SO→P, OP→S access patterns which are rare in practice.
 *   The tradeoff is that SP-only and SO-only queries scan SPO with a two-key
 *   prefix, which is still O(log n + k) — acceptable.
 */

import type { IDBPDatabase, IDBPTransaction } from "idb";
import type { IDBHexastoreSchema } from "./TermDictionary";
import type { BoundPattern, QuadIds } from "./types";
import { INDEX_STORES } from "./types";
import { buildPrefixRange, spoKey, opsKey, psoKey } from "./keyrange";

/** The arity of our compound keys (s + p + o + g = 4 components) */
const KEY_ARITY = 4;

type RWTx = IDBPTransaction<
  IDBHexastoreSchema,
  typeof INDEX_STORES,
  "readwrite"
>;

/**
 * Choose the best index for the given pattern and build the prefix array.
 * Returns [indexName, prefix] where prefix is passed to buildPrefixRange.
 */
function selectIndex(pattern: BoundPattern): {
  index: "spo" | "ops" | "pso";
  prefix: (number | undefined)[];
} {
  const { s, p, o } = pattern;

  if (s !== undefined) {
    // SPO: [s, p, o, g]
    return {
      index: "spo",
      prefix: [s, p, o, pattern.g],
    };
  }

  if (p !== undefined) {
    // PSO: [p, s, o, g]
    return {
      index: "pso",
      prefix: [p, s, o, pattern.g],
    };
  }

  if (o !== undefined) {
    // OPS: [o, p, s, g]
    return {
      index: "ops",
      prefix: [o, p, s, pattern.g],
    };
  }

  // No bound terms — full SPO scan
  return {
    index: "spo",
    prefix: [],
  };
}

/**
 * Decode a raw key array from an index record back into {s,p,o,g}.
 * Each index stores keys in a different permutation.
 */
function decodeKey(index: "spo" | "ops" | "pso", rawKey: number[]): QuadIds {
  switch (index) {
    case "spo": {
      const [s, p, o, g] = rawKey;
      return { s, p, o, g };
    }
    case "ops": {
      const [o, p, s, g] = rawKey;
      return { s, p, o, g };
    }
    case "pso": {
      const [p, s, o, g] = rawKey;
      return { s, p, o, g };
    }
  }
}

export class IndexManager {
  /**
   * Insert a quad's ID-tuple into all three index stores.
   * Must be called within a readwrite transaction covering all index stores.
   */
  async insertQuad(tx: RWTx, ids: QuadIds): Promise<void> {
    const { s, p, o, g } = ids;
    const spoStore = tx.objectStore("spo");
    const opsStore = tx.objectStore("ops");
    const psoStore = tx.objectStore("pso");
    await Promise.all([
      spoStore.put(undefined as never, spoKey(s, p, o, g)),
      opsStore.put(undefined as never, opsKey(s, p, o, g)),
      psoStore.put(undefined as never, psoKey(s, p, o, g)),
    ]);
  }

  /**
   * Delete a quad's ID-tuple from all three index stores.
   * Must be called within a readwrite transaction covering all index stores.
   */
  async deleteQuad(tx: RWTx, ids: QuadIds): Promise<void> {
    const { s, p, o, g } = ids;
    const spoStore = tx.objectStore("spo");
    const opsStore = tx.objectStore("ops");
    const psoStore = tx.objectStore("pso");
    await Promise.all([
      spoStore.delete(spoKey(s, p, o, g)),
      opsStore.delete(opsKey(s, p, o, g)),
      psoStore.delete(psoKey(s, p, o, g)),
    ]);
  }

  /**
   * Scan the best index for the given pattern and yield matching QuadIds.
   *
   * Uses getAllKeys() to fetch all matching keys in a single IDB request,
   * completing the transaction before yielding. This avoids the classic
   * TransactionInactiveError that occurs when `yield` suspends execution
   * between cursor.continue() calls, allowing the transaction to auto-commit.
   *
   * Memory trade-off: all matching key arrays are loaded before yielding.
   * Each key is 4 numbers (32 bytes), so 10k quads ≈ 320KB — acceptable for
   * in-browser use. For the dominant use-case (querying with bound subject or
   * predicate), the result set is small anyway.
   */
  async *matchQuads(
    db: IDBPDatabase<IDBHexastoreSchema>,
    pattern: BoundPattern,
  ): AsyncIterable<QuadIds> {
    const { index, prefix } = selectIndex(pattern);
    const range = buildPrefixRange(prefix, KEY_ARITY);

    // Collect all keys in one transaction, then close it before yielding.
    // Mixing `yield` with open IDB transactions causes TransactionInactiveError.
    const allKeys = await db
      .transaction(index, "readonly")
      .objectStore(index)
      .getAllKeys(range ?? undefined);

    for (const key of allKeys) {
      const ids = decodeKey(index, key as number[]);

      // Post-scan filter for all bound components.
      // The IDBKeyRange only covers the *contiguous leading prefix* of the
      // chosen index key.  Any bound component that falls after an unbound one
      // (e.g. o in PSO when s is unbound) is not enforced by the range and
      // must be checked here.
      if (pattern.s !== undefined && ids.s !== pattern.s) continue;
      if (pattern.p !== undefined && ids.p !== pattern.p) continue;
      if (pattern.o !== undefined && ids.o !== pattern.o) continue;
      if (pattern.g !== undefined && ids.g !== pattern.g) continue;

      yield ids;
    }
  }

  /**
   * Count quads matching the given pattern without materializing them.
   *
   * Uses IDBObjectStore.count(keyRange) which is O(log n) in most IndexedDB
   * implementations — far cheaper than iterating.
   *
   * Limitation: when g is bound but s/p/o are not fully bound, the count may
   * over-count (IDBKeyRange cannot express "middle" predicates).  We fall back
   * to iteration in that case.
   */
  async countQuads(
    db: IDBPDatabase<IDBHexastoreSchema>,
    pattern: BoundPattern,
  ): Promise<number> {
    const { index, prefix } = selectIndex(pattern);

    // The fast IDBObjectStore.count(range) path is only accurate when the
    // IDBKeyRange precisely covers all bound components — i.e. the bound
    // components form a contiguous leading prefix of the chosen index key.
    // If any bound component follows an unbound one ("gap"), the range is
    // wider than intended and we must fall back to iterating + post-filtering.
    const prefixHasGap = (() => {
      let seenUnbound = false;
      for (const v of prefix) {
        if (v === undefined) {
          seenUnbound = true;
        } else if (seenUnbound) {
          return true;
        }
      }
      return false;
    })();

    if (prefixHasGap) {
      let count = 0;
      for await (const _ids of this.matchQuads(db, pattern)) {
        count++;
      }
      return count;
    }

    const range = buildPrefixRange(prefix, KEY_ARITY);
    const tx = db.transaction(index, "readonly");
    const store = tx.objectStore(index);
    return store.count(range ?? undefined);
  }
}
