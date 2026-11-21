import get from "lodash-es/get";

import type { ListingSort } from "./types";

export type SortFieldAccessor<T> = string | ((doc: T) => unknown);

export type SortFieldMap<T = Record<string, unknown>> = Record<
  string,
  SortFieldAccessor<T>
>;

function resolveValue<T>(
  doc: T,
  field: string,
  fieldMap?: SortFieldMap<T>,
): unknown {
  const accessor = fieldMap?.[field];
  if (typeof accessor === "function") {
    return accessor(doc);
  }
  const path = typeof accessor === "string" ? accessor : field;
  return get(doc as object, path);
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Stable client-side sort. Unknown sort fields fall back to direct property path.
 */
export function sortDocuments<T>(
  documents: T[],
  sort: ListingSort[] | undefined,
  fieldMap?: SortFieldMap<T>,
): T[] {
  if (!sort?.length) {
    return documents;
  }
  const indexed = documents.map((doc, index) => ({ doc, index }));
  indexed.sort((left, right) => {
    for (const entry of sort) {
      const cmp = compareValues(
        resolveValue(left.doc, entry.field, fieldMap),
        resolveValue(right.doc, entry.field, fieldMap),
      );
      if (cmp !== 0) {
        return entry.desc ? -cmp : cmp;
      }
    }
    return left.index - right.index;
  });
  return indexed.map((row) => row.doc);
}

/** Parse `name:asc,size:desc` (default direction asc). */
export function parseSortParam(raw: string | null | undefined): ListingSort[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [field, dir] = part.split(":");
      return {
        field: field.trim(),
        desc: (dir ?? "asc").trim().toLowerCase() === "desc",
      };
    })
    .filter((s) => s.field.length > 0);
}

export function serializeSortParam(
  sort: ListingSort[] | undefined,
): string | null {
  if (!sort?.length) return null;
  return sort.map((s) => `${s.field}:${s.desc ? "desc" : "asc"}`).join(",");
}
