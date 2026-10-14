/**
 * Prisma-style orderBy helpers for extracted object arrays.
 *
 * SPARQL CONSTRUCT materializes unordered triples, so JSON array order must be
 * restored after graph extraction whenever `include.*.orderBy` is set.
 */
import type { OrderByClause } from "@graviola/edb-core-types";
import { compareOrderValues } from "@graviola/edb-core-utils";

export function normalizeOrderBy(
  orderBy: OrderByClause | OrderByClause[] | undefined,
): OrderByClause[] {
  if (!orderBy) return [];
  return Array.isArray(orderBy) ? orderBy : [orderBy];
}

/**
 * Compare two objects by Prisma-style orderBy clause(s).
 */
export function compareByOrderBy(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  orderBy: OrderByClause | OrderByClause[] | undefined,
): number {
  for (const clause of normalizeOrderBy(orderBy)) {
    for (const [property, direction] of Object.entries(clause)) {
      if (!direction) continue;
      const cmp = compareOrderValues(a?.[property], b?.[property]);
      if (cmp !== 0) return direction === "desc" ? -cmp : cmp;
    }
  }
  return 0;
}

export function sortObjectArrayByOrderBy<T extends Record<string, unknown>>(
  items: T[],
  orderBy: OrderByClause | OrderByClause[] | undefined,
): T[] {
  if (!orderBy || items.length < 2) return items;
  return [...items].sort((a, b) => compareByOrderBy(a, b, orderBy));
}

type IncludeNode = {
  take?: number;
  skip?: number;
  orderBy?: OrderByClause | OrderByClause[];
  include?: Record<string, boolean | IncludeNode>;
  where?: unknown;
  select?: unknown;
  omit?: unknown;
};

function isIncludeNode(value: unknown): value is IncludeNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Walk a document tree and apply include.orderBy / take / skip.
 *
 * @param slice - when true, apply take/skip (SPARQL 1.1 path). When false,
 *   only sort — LATERAL already limited the CONSTRUCT dataset.
 */
export function applyIncludeOrderByAndSlice<T>(
  document: T,
  include: Record<string, unknown> | undefined,
  options: { slice: boolean },
): T {
  if (!include || document == null || typeof document !== "object") {
    return document;
  }

  const doc = document as Record<string, unknown>;

  for (const [key, raw] of Object.entries(include)) {
    if (raw === true || raw === false || raw == null) continue;
    if (!isIncludeNode(raw)) continue;

    const value = doc[key];
    if (Array.isArray(value)) {
      let next = value as Record<string, unknown>[];
      if (raw.orderBy) {
        next = sortObjectArrayByOrderBy(next, raw.orderBy);
      }
      if (options.slice && (raw.take !== undefined || raw.skip !== undefined)) {
        const skip = raw.skip ?? 0;
        const end = raw.take !== undefined ? skip + raw.take : undefined;
        next = next.slice(skip, end);
      }
      if (raw.include) {
        next = next.map((item) =>
          applyIncludeOrderByAndSlice(
            item,
            raw.include as Record<string, unknown>,
            options,
          ),
        );
      }
      doc[key] = next;
    } else if (value && typeof value === "object" && raw.include) {
      doc[key] = applyIncludeOrderByAndSlice(
        value,
        raw.include as Record<string, unknown>,
        options,
      );
    }
  }

  return document;
}
