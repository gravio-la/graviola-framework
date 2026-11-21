import type { ChildrenListingSource } from "./types";
import type { SortFieldMap } from "./sortDocuments";
import { sortDocuments } from "./sortDocuments";

/**
 * Minimal Store surface required for the filterMany children source.
 * Duck-typed so any Filters-capable store works without schema generics.
 */
export type FilterManyStore = {
  filterMany(
    typeName: string,
    options?: {
      where?: Record<string, unknown>;
      limit?: number;
    },
  ): Promise<Record<string, unknown>[]>;
};

export type RootsMode = "absentParent";

export type CreateFilterManyChildrenSourceOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  store: FilterManyStore;
  typeName: string;
  /** Relationship / parent property used for containment (e.g. adapter-supplied). */
  parentField: string;
  /**
   * How `listRoots` finds top-level entities.
   * `absentParent` → `{ [parentField]: { none: {} } }` (SPARQL `FILTER NOT EXISTS`).
   */
  rootsMode?: RootsMode;
  /** Map sort keys → document field paths or accessors for client-side sort. */
  sortFieldMap?: SortFieldMap<T>;
  /**
   * Cap passed to `filterMany` before client sort / slice.
   * Defaults to 2000. True SPARQL OFFSET is not used.
   */
  fetchCap?: number;
};

function parentEqualsWhere(
  parentField: string,
  parentId: string,
): Record<string, unknown> {
  return {
    [parentField]: {
      equals: { "@id": parentId },
    },
  };
}

function absentParentWhere(parentField: string): Record<string, unknown> {
  // `none: {}` → FILTER NOT EXISTS { ?s :parentField ?v } in sparql-schema.
  return {
    [parentField]: {
      none: {},
    },
  };
}

function applyClientPage<T>(
  documents: T[],
  opts:
    | {
        limit?: number;
        offset?: number;
        sort?: { field: string; desc?: boolean }[];
      }
    | undefined,
  sortFieldMap?: SortFieldMap<T>,
): {
  documents: T[];
  estimatedTotalHits: number;
  hasMore: boolean;
} {
  const sorted = sortDocuments(documents, opts?.sort, sortFieldMap);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit;
  const page =
    limit != null ? sorted.slice(offset, offset + limit) : sorted.slice(offset);
  const hasMore = limit != null ? offset + page.length < sorted.length : false;
  return {
    documents: page,
    estimatedTotalHits: sorted.length,
    hasMore,
  };
}

/**
 * ChildrenListingSource backed by Store `filterMany`.
 *
 * - Children: `{ [parentField]: { equals: { "@id": parentId } } }`
 * - Roots (`rootsMode: "absentParent"`): NOT EXISTS on `parentField`
 * - Sort: client-side via `sortFieldMap`
 * - Limit: post-fetch slice after sort (fetch capped by `fetchCap`)
 */
export function createFilterManyChildrenSource<
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateFilterManyChildrenSourceOptions<T>): ChildrenListingSource<T> {
  const {
    store,
    typeName,
    parentField,
    rootsMode = "absentParent",
    sortFieldMap,
    fetchCap = 2000,
  } = options;

  async function fetchWhere(where: Record<string, unknown>): Promise<T[]> {
    const rows = await store.filterMany(typeName, {
      where,
      limit: fetchCap,
    });
    return rows as T[];
  }

  return {
    async listRoots(opts) {
      if (rootsMode !== "absentParent") {
        throw new Error(
          `createFilterManyChildrenSource: unsupported rootsMode "${String(rootsMode)}"`,
        );
      }
      const all = await fetchWhere(absentParentWhere(parentField));
      return applyClientPage(all, opts, sortFieldMap);
    },

    async listChildren(parentId, opts) {
      const all = await fetchWhere(parentEqualsWhere(parentField, parentId));
      return applyClientPage(all, opts, sortFieldMap);
    },
  };
}
