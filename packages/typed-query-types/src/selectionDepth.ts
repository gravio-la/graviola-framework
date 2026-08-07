/**
 * Depth of an explicit include/selection tree.
 *
 * Depth counts named-entity hops: a flat `include: { patch: true }` is depth 1;
 * `{ patch: { include: { plots: true } } }` is depth 2. Used so CONSTRUCT /
 * extraction honour the selection set instead of inventing `maxRecursion: 4`.
 */

export type IncludeTree =
  | boolean
  | null
  | undefined
  | {
      include?: Record<string, IncludeTree>;
      select?: Record<string, unknown>;
      omit?: unknown;
      where?: unknown;
      maxRecursion?: number;
      [key: string]: unknown;
    };

/**
 * Return the maximum nesting depth of an include tree (0 if absent/empty).
 */
export function selectionDepth(
  include: Record<string, IncludeTree> | undefined | null,
): number {
  if (!include || typeof include !== "object") return 0;
  let max = 0;
  for (const value of Object.values(include)) {
    if (value === true) {
      max = Math.max(max, 1);
      continue;
    }
    if (!value || typeof value !== "object") continue;
    const nested = selectionDepth(
      value.include as Record<string, IncludeTree> | undefined,
    );
    max = Math.max(max, 1 + nested);
  }
  return max;
}

/**
 * Walk an include tree and collect path labels that sit at depth greater than
 * `maxDepth` (1-based entity hops).
 */
export function truncatedSelectionPaths(
  include: Record<string, IncludeTree> | undefined | null,
  maxDepth: number,
  prefix = "",
): string[] {
  if (!include || typeof include !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(include)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (maxDepth < 1) {
      out.push(path);
      continue;
    }
    if (value === true) continue;
    if (!value || typeof value !== "object") continue;
    const nested = value.include as Record<string, IncludeTree> | undefined;
    if (nested) {
      out.push(...truncatedSelectionPaths(nested, maxDepth - 1, path));
    }
  }
  return out;
}

export class SelectionTruncationError extends Error {
  readonly truncatedPaths: string[];
  readonly selectionDepth: number;
  readonly maxRecursion: number;

  constructor(args: {
    truncatedPaths: string[];
    selectionDepth: number;
    maxRecursion: number;
  }) {
    super(
      `Selection set depth ${args.selectionDepth} exceeds maxRecursion ${args.maxRecursion}; ` +
        `would silently truncate: ${args.truncatedPaths.join(", ") || "(root)"}`,
    );
    this.name = "SelectionTruncationError";
    this.truncatedPaths = args.truncatedPaths;
    this.selectionDepth = args.selectionDepth;
    this.maxRecursion = args.maxRecursion;
  }
}

/**
 * Resolve the effective recursion depth for a query.
 *
 * - Explicit `maxRecursion` lower than include tree depth → throw
 *   (silent truncation is no longer allowed).
 * - Explicit `maxRecursion` ≥ selection depth → use it.
 * - No explicit `maxRecursion` but an include tree → honour the selection depth.
 * - Neither → fall back to `defaultMaxRecursion` (historically 4).
 */
export function resolveEffectiveMaxRecursion(args: {
  include?: Record<string, IncludeTree> | null;
  maxRecursion?: number;
  defaultMaxRecursion?: number;
}): number {
  const { include, maxRecursion, defaultMaxRecursion = 4 } = args;
  const depth = selectionDepth(include);
  if (typeof maxRecursion === "number") {
    if (depth > maxRecursion) {
      throw new SelectionTruncationError({
        truncatedPaths: truncatedSelectionPaths(include, maxRecursion),
        selectionDepth: depth,
        maxRecursion,
      });
    }
    return maxRecursion;
  }
  if (depth > 0) return depth;
  return defaultMaxRecursion;
}
