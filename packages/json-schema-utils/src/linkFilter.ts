import cloneDeepWith from "lodash-es/cloneDeepWith";
import get from "lodash-es/get";
import isPlainObject from "lodash-es/isPlainObject";

/** Declarative candidate restriction for relation pickers (Prisma-style `where`). */
export type LinkFilter = {
  where: Record<string, unknown>;
  onUnresolved?: "ignore" | "empty";
  description?: string;
  mode?: "override" | "and";
};

/** Side-schema shape: `linkFilters[TypeName][slot]`. */
export type LinkFiltersConfig = Record<string, Record<string, LinkFilter>>;

const UNRESOLVED = Symbol("linkFilter.unresolved");

function isDataRef(value: unknown): value is { $data: string } {
  return (
    isPlainObject(value) &&
    typeof (value as { $data?: unknown }).$data === "string" &&
    Object.keys(value as object).length === 1
  );
}

function pruneUnresolved(value: unknown): unknown {
  if (value === UNRESOLVED) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const next = value
      .map((entry) => pruneUnresolved(entry))
      .filter((entry) => entry !== undefined);
    return next.length > 0 ? next : undefined;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    const record = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(record)) {
      const pruned = pruneUnresolved(child);
      if (pruned !== undefined) {
        out[key] = pruned;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return value;
}

/**
 * Resolve `$data` binding paths in `filter.where` against root form data.
 * Unresolved bindings drop their containing clause (`ignore`, default) or
 * signal empty candidates (`empty`).
 */
export function resolveLinkFilterWhere(
  filter: LinkFilter | undefined,
  rootData: unknown,
): { where?: Record<string, unknown>; unresolved: boolean } {
  if (!filter?.where || !isPlainObject(filter.where)) {
    return { unresolved: false };
  }

  const onUnresolved = filter.onUnresolved ?? "ignore";
  let sawUnresolved = false;

  const withBindings = cloneDeepWith(filter.where, (value) => {
    if (isDataRef(value)) {
      const resolved = get(rootData as object, value.$data);
      if (resolved === undefined) {
        sawUnresolved = true;
        return UNRESOLVED;
      }
      return resolved;
    }
    return undefined;
  });

  if (sawUnresolved && onUnresolved === "empty") {
    return { unresolved: true };
  }

  const pruned = pruneUnresolved(withBindings);
  if (pruned === undefined || !isPlainObject(pruned)) {
    return { unresolved: sawUnresolved && onUnresolved === "empty" };
  }

  return {
    where: pruned as Record<string, unknown>,
    unresolved: false,
  };
}

/** Merge side-schema and per-control link filters; control wins unless `mode: "and"`. */
export function mergeLinkFilters(
  base: LinkFilter | undefined,
  override: LinkFilter | undefined,
): LinkFilter | undefined {
  if (!override) {
    return base;
  }
  if (!base) {
    return override;
  }
  const mode = override.mode ?? "override";
  if (mode === "and") {
    return {
      ...base,
      ...override,
      where: { AND: [base.where, override.where] },
      mode: "override",
    };
  }
  return {
    ...base,
    ...override,
    where: override.where,
  };
}
