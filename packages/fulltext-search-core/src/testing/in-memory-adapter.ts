import type {
  FullTextSearchAdapter,
  IndexDocument,
  IndexSettings,
  TextIndexQuery,
  TextIndexResult,
} from "../engine";
import { isFacetFilterRange } from "../engine";

type StoredDoc = IndexDocument;

function docMatchesQuery(doc: StoredDoc, q: TextIndexQuery): boolean {
  const term = q.q.trim().toLowerCase();
  if (!term) return true;

  const fields = q.attributesToSearchOn?.length
    ? q.attributesToSearchOn
    : Object.keys(doc).filter((k) => k !== "id");

  for (const field of fields) {
    const val = doc[field];
    if (val == null) continue;
    if (String(val).toLowerCase().includes(term)) return true;
  }
  return false;
}

function docMatchesFilters(
  doc: StoredDoc,
  filters: TextIndexQuery["filters"],
): boolean {
  if (!filters?.length) return true;
  for (const f of filters) {
    const val = doc[f.field];
    if (isFacetFilterRange(f)) {
      const num = typeof val === "number" ? val : Number(val);
      if (Number.isNaN(num)) return false;
      if (f.gte != null && num < f.gte) return false;
      if (f.lte != null && num > f.lte) return false;
    } else {
      if (String(val) !== String(f.value)) return false;
    }
  }
  return true;
}

function computeFacets(
  docs: StoredDoc[],
  facetFields: string[] | undefined,
): Record<string, Record<string, number>> | undefined {
  if (!facetFields?.length) return undefined;
  const distribution: Record<string, Record<string, number>> = {};
  for (const field of facetFields) {
    distribution[field] = {};
    for (const doc of docs) {
      const val = doc[field];
      if (val == null) continue;
      const key = String(val);
      distribution[field][key] = (distribution[field][key] ?? 0) + 1;
    }
  }
  return distribution;
}

/**
 * Minimal in-memory {@link FullTextSearchAdapter} for unit tests and as a reference
 * for future client-only engines (Lunr / MiniSearch).
 */
export function createInMemoryTextIndexAdapter(): FullTextSearchAdapter & {
  /** Test helper: read all docs in an index. */
  getIndex(uid: string): StoredDoc[];
} {
  const indexes = new Map<
    string,
    { settings: IndexSettings; docs: StoredDoc[] }
  >();

  return {
    engine: "in-memory",

    async ensureIndex(uid, settings) {
      const existing = indexes.get(uid);
      indexes.set(uid, {
        settings,
        docs: existing?.docs ?? [],
      });
    },

    async addDocuments(uid, docs) {
      const entry = indexes.get(uid);
      if (!entry) {
        throw new Error(
          `Index "${uid}" does not exist — call ensureIndex first`,
        );
      }
      const byId = new Map(entry.docs.map((d) => [d.id, d]));
      for (const doc of docs) {
        byId.set(doc.id, { ...doc });
      }
      entry.docs = [...byId.values()];
    },

    async search(uid, q) {
      const entry = indexes.get(uid);
      if (!entry) {
        return { hits: [], estimatedTotalHits: 0, query: q.q };
      }

      const matched = entry.docs.filter(
        (doc) => docMatchesQuery(doc, q) && docMatchesFilters(doc, q.filters),
      );

      const offset = Math.max(0, q.offset ?? 0);
      const slice = matched.slice(offset, offset + q.limit);

      return {
        hits: slice.map((doc, i) => ({
          id: doc.id,
          score: 1 - i / Math.max(slice.length, 1),
          document: { ...doc },
        })),
        estimatedTotalHits: matched.length,
        facetDistribution: computeFacets(matched, q.facets),
        query: q.q,
      } satisfies TextIndexResult;
    },

    async clearIndex(uid) {
      const entry = indexes.get(uid);
      if (entry) entry.docs = [];
    },

    async deleteIndex(uid) {
      indexes.delete(uid);
    },

    getIndex(uid) {
      return [...(indexes.get(uid)?.docs ?? [])];
    },
  };
}
