import type { OrderBySpec } from "@graviola/edb-core-types";
import isEqual from "lodash-es/isEqual";

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

function orderItemIdentity(item: unknown): unknown {
  if (item != null && typeof item === "object" && !Array.isArray(item)) {
    const id = (item as Record<string, unknown>)["@id"];
    if (id !== undefined && id !== null && id !== "") {
      return id;
    }
  }
  return undefined;
}

function arraysSameItemsPermutation(
  prevArr: unknown[],
  nextArr: unknown[],
): boolean {
  if (prevArr.length !== nextArr.length) {
    return false;
  }
  const used = new Array<boolean>(nextArr.length).fill(false);
  for (const prevItem of prevArr) {
    let matched = false;
    for (let i = 0; i < nextArr.length; i++) {
      if (used[i]) {
        continue;
      }
      const nextItem = nextArr[i];
      if (prevItem === nextItem) {
        used[i] = true;
        matched = true;
        break;
      }
      const prevId = orderItemIdentity(prevItem);
      const nextId = orderItemIdentity(nextItem);
      if (prevId !== undefined && nextId !== undefined && prevId === nextId) {
        used[i] = true;
        matched = true;
        break;
      }
      if (isEqual(prevItem, nextItem)) {
        used[i] = true;
        matched = true;
        break;
      }
    }
    if (!matched) {
      return false;
    }
  }
  return true;
}

/**
 * When `nextArr` is a pure reordering of `prevArr`, assign the order field to
 * 1..n (asc) or n..1 (desc) so JSON Forms move-up/down persist. Otherwise
 * return `nextArr` unchanged.
 */
export function renumberOrderField(
  prevArr: unknown[],
  nextArr: unknown[],
  spec: OrderBySpec,
  integerFields: Set<string>,
): unknown[] {
  const { field, direction } = spec;
  if (!integerFields.has(field)) {
    return nextArr;
  }
  if (!Array.isArray(prevArr) || !Array.isArray(nextArr)) {
    return nextArr;
  }
  if (!arraysSameItemsPermutation(prevArr, nextArr)) {
    return nextArr;
  }
  if (
    prevArr.length === nextArr.length &&
    prevArr.every((item, i) => item === nextArr[i])
  ) {
    return nextArr;
  }

  const n = nextArr.length;
  let changed = false;
  const result = nextArr.map((item, i) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }
    const record = item as Record<string, unknown>;
    const pos = direction === "desc" ? n - i : i + 1;
    if (record[field] === pos) {
      return item;
    }
    changed = true;
    return { ...record, [field]: pos };
  });

  return changed ? result : nextArr;
}

/** Assign 1..n when order values are missing or duplicated; otherwise unchanged. */
export function normalizeOrderValues(
  items: unknown[],
  field: string,
): unknown[] {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  const values = items.map((item) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      return undefined;
    }
    return orderValue(item as Record<string, unknown>, field);
  });

  const defined = values.filter((v) => v !== undefined);
  const hasMissing = defined.length !== items.length;
  const hasDuplicates =
    new Set(defined.map((v) => String(v))).size !== defined.length;

  if (!hasMissing && !hasDuplicates) {
    return items;
  }

  let changed = false;
  const result = items.map((item, i) => {
    const pos = i + 1;
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }
    const record = item as Record<string, unknown>;
    if (record[field] === pos) {
      return item;
    }
    changed = true;
    return { ...record, [field]: pos };
  });

  return changed ? result : items;
}

export function renumberOrderFieldInData<T extends Record<string, unknown>>(
  prev: T,
  next: T,
  specs: Record<string, OrderBySpec>,
  integerFields: Set<string>,
): T {
  let changed = false;
  let result: T | undefined;

  for (const [slot, spec] of Object.entries(specs)) {
    const prevArr = prev[slot];
    const nextArr = next[slot];
    if (!Array.isArray(prevArr) || !Array.isArray(nextArr)) {
      continue;
    }
    const renumbered = renumberOrderField(
      prevArr,
      nextArr,
      spec,
      integerFields,
    );
    if (renumbered !== nextArr) {
      changed = true;
      if (!result) {
        result = { ...next };
      }
      (result as Record<string, unknown>)[slot] = renumbered;
    }
  }

  return changed ? result! : next;
}

export function applyUserOrderedFormChange<T extends Record<string, unknown>>(
  prev: T,
  next: T,
  specs: Record<string, OrderBySpec>,
  integerFields: Set<string>,
): T {
  const withNew = fillNewItemOrderValues(prev, next, specs, integerFields);
  return renumberOrderFieldInData(prev, withNew, specs, integerFields);
}
