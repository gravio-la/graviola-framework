import type { ScopePointer } from "@graviola/search-facet-schema";

import type {
  FacetDescriptor,
  FacetRangeSelection,
  FacetScopeSelection,
  FacetSelection,
  FacetTermSelection,
} from "./types";

export function emptySelection(): FacetSelection {
  return {};
}

export function toggleTerm(
  selection: FacetSelection,
  scope: ScopePointer,
  value: string | number | boolean,
  multi = true,
): FacetSelection {
  const next = { ...selection };
  const current = next[scope];
  if (!multi) {
    const existing =
      current?.kind === "terms" && current.values[0] === value
        ? undefined
        : ({ kind: "terms", values: [value] } satisfies FacetTermSelection);
    if (existing) next[scope] = existing;
    else delete next[scope];
    return next;
  }

  const values =
    current?.kind === "terms"
      ? [...current.values]
      : ([] as (string | number | boolean)[]);
  const idx = values.findIndex((v) => String(v) === String(value));
  if (idx >= 0) values.splice(idx, 1);
  else values.push(value);

  if (values.length === 0) delete next[scope];
  else next[scope] = { kind: "terms", values };
  return next;
}

export function setRange(
  selection: FacetSelection,
  scope: ScopePointer,
  range: { gte?: number | string; lte?: number | string },
): FacetSelection {
  const next = { ...selection };
  if (range.gte == null && range.lte == null) {
    delete next[scope];
    return next;
  }
  next[scope] = { kind: "range", gte: range.gte, lte: range.lte };
  return next;
}

export function clearScope(
  selection: FacetSelection,
  scope: ScopePointer,
): FacetSelection {
  const next = { ...selection };
  delete next[scope];
  return next;
}

export function clearAll(): FacetSelection {
  return {};
}

export function isScopeActive(
  selection: FacetSelection,
  scope: ScopePointer,
): boolean {
  return Boolean(selection[scope]);
}

export function activeCount(selection: FacetSelection): number {
  let n = 0;
  for (const s of Object.values(selection)) {
    if (s.kind === "terms") n += s.values.length;
    else n += 1;
  }
  return n;
}

export function selectionForType(
  selection: FacetSelection,
  descriptors: FacetDescriptor[],
  typeName: string,
): FacetSelection {
  const scopes = new Set(
    descriptors.filter((d) => d.typeName === typeName).map((d) => d.scope),
  );
  const out: FacetSelection = {};
  for (const [scope, val] of Object.entries(selection)) {
    if (scopes.has(scope as ScopePointer)) {
      out[scope as ScopePointer] = val;
    }
  }
  return out;
}

export function getScopeSelection(
  selection: FacetSelection,
  scope: ScopePointer,
): FacetScopeSelection | undefined {
  return selection[scope];
}
