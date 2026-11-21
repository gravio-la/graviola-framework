/**
 * Domain-agnostic hierarchical listing contract.
 * Adapters supply type/field names; this package never names domain entities.
 */

/** JSON-LD-shaped browse document with a stable identity. */
export type BrowseDocument = Record<string, unknown> & { "@id": string };

export type ListingSort = {
  field: string;
  desc?: boolean;
};

/** @deprecated Prefer {@link ListingSort}. */
export type BrowseSortEntry = ListingSort;

export type ChildrenListingOptions = {
  limit?: number;
  /** Zero-based offset into the (optionally sorted) result set. */
  offset?: number;
  sort?: ListingSort[];
};

/** One page of children / roots from a listing source. */
export type ChildrenListingResult<T = BrowseDocument> = {
  documents: T[];
  estimatedTotalHits?: number;
  hasMore?: boolean;
};

/**
 * Pluggable children listing. Implement with Store `filterMany`, full-text
 * search, or any other backend — the UI only sees this shape.
 */
export type ChildrenListingSource<T = BrowseDocument> = {
  listRoots(opts?: ChildrenListingOptions): Promise<ChildrenListingResult<T>>;
  listChildren(
    parentId: string,
    opts?: ChildrenListingOptions,
  ): Promise<ChildrenListingResult<T>>;
  /**
   * Optional: tree-only listing of expandable (container) children.
   * When absent, `LazyTreePane` uses `listChildren`.
   */
  listExpandableChildren?(
    parentId: string,
    opts?: ChildrenListingOptions,
  ): Promise<ChildrenListingResult<T>>;
  /** When set, only matching nodes show an expand affordance. */
  isExpandable?(document: T): boolean;
};

export type HierarchicalBrowseView = "list" | "table" | (string & {});

export type HierarchicalBrowseParams = {
  root?: string | null;
  selected?: string | null;
  view?: HierarchicalBrowseView | null;
  /** Serialized sort, e.g. `name:asc` or `size:desc,name:asc`. */
  sort?: string | null;
};
