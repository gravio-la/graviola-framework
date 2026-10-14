import type { OrderBySpec } from "@graviola/edb-core-types";

/** Compare two order keys; null/undefined sort last (for Prisma-style orderBy). */
export function compareOrderValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/** Read a sort field from an item, unwrapping JSON-LD `{"@value": …}`; missing → undefined. */
export function orderValue(
  item: Record<string, unknown>,
  field: string,
): unknown {
  let raw: unknown = item[field];
  if (
    raw != null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "@value" in raw
  ) {
    raw = (raw as { "@value": unknown })["@value"];
  }
  if (raw === null || raw === undefined || raw === "") {
    return undefined;
  }
  return raw;
}

export function sortIndexedByOrderField<T>(
  items: T[],
  spec?: OrderBySpec,
): { item: T; index: number }[] {
  const indexed = items.map((item, index) => ({ item, index }));
  if (!spec) {
    return indexed;
  }

  const { field, direction } = spec;
  const withValue: { item: T; index: number }[] = [];
  const withoutValue: { item: T; index: number }[] = [];

  for (const entry of indexed) {
    const record = entry.item as Record<string, unknown>;
    if (orderValue(record, field) === undefined) {
      withoutValue.push(entry);
    } else {
      withValue.push(entry);
    }
  }

  withValue.sort((a, b) => {
    const va = orderValue(a.item as Record<string, unknown>, field);
    const vb = orderValue(b.item as Record<string, unknown>, field);
    let cmp = compareOrderValues(va, vb);
    if (direction === "desc") {
      cmp = -cmp;
    }
    return cmp;
  });

  return [...withValue, ...withoutValue];
}

export function sortByOrderField<T>(items: T[], spec?: OrderBySpec): T[] {
  return sortIndexedByOrderField(items, spec).map(({ item }) => item);
}

/** Next integer order value (max existing + 1); 1 when no usable values exist. */
export function nextOrderValue(items: unknown[], field: string): number {
  let max = 0;
  for (const item of items) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const raw = orderValue(item as Record<string, unknown>, field);
    if (raw === undefined) {
      continue;
    }
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isInteger(n) && !Number.isNaN(n)) {
      max = Math.max(max, n);
    }
  }
  return max + 1;
}

type UiSchemaNode = {
  type?: string;
  scope?: string;
  options?: { orderBy?: OrderBySpec };
  elements?: UiSchemaNode[];
};

const TOP_LEVEL_PROPERTY_SCOPE = /^#\/properties\/([^/]+)$/;

/** Collect slot → orderBy spec from a JSON Forms UI schema tree. */
export function orderSpecsFromUiSchema(
  uischema: UiSchemaNode | undefined,
): Record<string, OrderBySpec> {
  const specs: Record<string, OrderBySpec> = {};
  if (!uischema) {
    return specs;
  }

  const walk = (node: UiSchemaNode): void => {
    if (
      node.type === "Control" &&
      node.scope &&
      node.options?.orderBy &&
      typeof node.options.orderBy.field === "string"
    ) {
      const match = TOP_LEVEL_PROPERTY_SCOPE.exec(node.scope);
      if (match) {
        specs[match[1]] = node.options.orderBy;
      }
    }
    if (node.elements) {
      for (const child of node.elements) {
        walk(child);
      }
    }
  };

  walk(uischema);
  return specs;
}

export function sortDataByOrderSpecs<T extends Record<string, unknown>>(
  data: T,
  specs: Record<string, OrderBySpec>,
): T {
  let changed = false;
  let result: T | undefined;

  for (const [slot, spec] of Object.entries(specs)) {
    const arr = data[slot];
    if (!Array.isArray(arr)) {
      continue;
    }
    const sorted = sortByOrderField(arr, spec);
    if (
      sorted.length !== arr.length ||
      sorted.some((item, i) => item !== arr[i])
    ) {
      changed = true;
      if (!result) {
        result = { ...data };
      }
      (result as Record<string, unknown>)[slot] = sorted;
    }
  }

  return changed ? result! : data;
}

export function fillNewItemOrderValues<T extends Record<string, unknown>>(
  prev: T,
  next: T,
  specs: Record<string, OrderBySpec>,
  integerFields: Set<string>,
): T {
  let changed = false;
  let result: T | undefined;

  for (const [slot, spec] of Object.entries(specs)) {
    const { field } = spec;
    if (!integerFields.has(field)) {
      continue;
    }

    const prevArr = prev[slot];
    const nextArr = next[slot];
    if (!Array.isArray(prevArr) || !Array.isArray(nextArr)) {
      continue;
    }
    if (nextArr.length <= prevArr.length) {
      continue;
    }

    const working = nextArr.map((item) =>
      item != null && typeof item === "object" && !Array.isArray(item)
        ? { ...(item as Record<string, unknown>) }
        : item,
    );

    let slotChanged = false;
    for (let i = prevArr.length; i < working.length; i++) {
      const item = working[i];
      if (item == null || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }
      const record = item as Record<string, unknown>;
      if (orderValue(record, field) !== undefined) {
        continue;
      }
      const value = nextOrderValue(working.slice(0, i), field);
      working[i] = { ...record, [field]: value };
      slotChanged = true;
    }

    if (slotChanged) {
      changed = true;
      if (!result) {
        result = { ...next };
      }
      (result as Record<string, unknown>)[slot] = working;
    }
  }

  return changed ? result! : next;
}
