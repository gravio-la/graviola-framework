import type {
  FullTextSearchAdapter,
  IndexDocument,
  IndexSettings,
  TextIndexQuery,
  TextIndexResult,
} from "../engine";
import {
  FullTextEngineError,
  isFacetFilterIn,
  isFacetFilterRange,
} from "../engine";

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
    } else if (isFacetFilterIn(f)) {
      if (!f.values.some((v) => String(val) === String(v))) return false;
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

export type InMemoryTextIndexAdapterOptions = {
  /** Reject unknown searchable/filter/facet attributes like Meilisearch. */
  strictSchema?: boolean;
};

function isWildcard(attrs: string[]): boolean {
  return attrs.length === 0 || (attrs.length === 1 && attrs[0] === "*");
}

function assertQueryAgainstSettings(
  uid: string,
  q: TextIndexQuery,
  settings: IndexSettings,
): void {
  const searchable = settings.searchableAttributes;
  if (q.attributesToSearchOn?.length && !isWildcard(searchable)) {
    for (const f of q.attributesToSearchOn) {
      if (!searchable.includes(f)) {
        throw new FullTextEngineError(
          `invalid_search_attributes_to_search_on: ${f}`,
          {
            status: 400,
            code: "invalid_search_attributes_to_search_on",
            indexUid: uid,
          },
        );
      }
    }
  }

  const filterable = settings.filterableAttributes;
  if (q.filters?.length && !isWildcard(filterable)) {
    for (const f of q.filters) {
      if (!filterable.includes(f.field)) {
        throw new FullTextEngineError(`invalid_search_filter: ${f.field}`, {
          status: 400,
          code: "invalid_search_filter",
          indexUid: uid,
        });
      }
    }
  }

  if (q.facets?.length && !isWildcard(filterable)) {
    for (const f of q.facets) {
      if (!filterable.includes(f)) {
        throw new FullTextEngineError(`invalid_search_facets: ${f}`, {
          status: 400,
          code: "invalid_search_facets",
          indexUid: uid,
        });
      }
    }
  }

  // Empty sortableAttributes means nothing is sortable (unlike searchable/filterable).
  const sortable = settings.sortableAttributes ?? [];
  if (q.sort?.length) {
    const allowAll = sortable.length === 1 && sortable[0] === "*";
    if (!allowAll) {
      for (const clause of q.sort) {
        const field = clause.split(":")[0] ?? clause;
        if (!sortable.includes(field)) {
          throw new FullTextEngineError(`invalid_search_sort: ${field}`, {
            status: 400,
            code: "invalid_search_sort",
            indexUid: uid,
          });
        }
      }
    }
  }
}

function compareSortValue(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function applySort(docs: StoredDoc[], sort: string[] | undefined): StoredDoc[] {
  if (!sort?.length) return docs;
  const clauses = sort.map((clause) => {
    const [field, dir] = clause.split(":");
    return { field: field ?? clause, desc: dir === "desc" };
  });
  return [...docs].sort((left, right) => {
    for (const { field, desc } of clauses) {
      const cmp = compareSortValue(left[field], right[field]);
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
}

/**
 * Minimal in-memory {@link FullTextSearchAdapter} for unit tests and as a reference
 * for future client-only engines (Lunr / MiniSearch).
 */
export function createInMemoryTextIndexAdapter(
  options: InMemoryTextIndexAdapterOptions = {},
): FullTextSearchAdapter & {
  /** Test helper: read all docs in an index. */
  getIndex(uid: string): StoredDoc[];
  /** Test helper: replace live settings for an index. */
  setIndexSettings(uid: string, settings: IndexSettings): void;
} {
  const strictSchema = options.strictSchema ?? false;
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

    async deleteDocuments(uid, ids) {
      const entry = indexes.get(uid);
      if (!entry || ids.length === 0) return;
      const remove = new Set(ids);
      entry.docs = entry.docs.filter((d) => !remove.has(d.id));
    },

    async search(uid, q) {
      const entry = indexes.get(uid);
      if (!entry) {
        return { hits: [], estimatedTotalHits: 0, query: q.q };
      }

      if (strictSchema) {
        assertQueryAgainstSettings(uid, q, entry.settings);
      }

      const matched = applySort(
        entry.docs.filter(
          (doc) => docMatchesQuery(doc, q) && docMatchesFilters(doc, q.filters),
        ),
        q.sort,
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

    async getIndexSettings(uid) {
      const entry = indexes.get(uid);
      if (!entry) return null;
      return {
        primaryKey: entry.settings.primaryKey,
        searchableAttributes: [...entry.settings.searchableAttributes],
        filterableAttributes: [...entry.settings.filterableAttributes],
        sortableAttributes: entry.settings.sortableAttributes
          ? [...entry.settings.sortableAttributes]
          : undefined,
      };
    },

    async getIndexStats(uid) {
      const entry = indexes.get(uid);
      if (!entry) return null;
      return { numberOfDocuments: entry.docs.length };
    },

    getIndex(uid) {
      return [...(indexes.get(uid)?.docs ?? [])];
    },

    setIndexSettings(uid, settings) {
      const entry = indexes.get(uid);
      if (!entry) {
        throw new Error(`Index "${uid}" does not exist`);
      }
      entry.settings = settings;
    },
  };
}
