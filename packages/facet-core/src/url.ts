import type { ScopePointer } from "@graviola/search-facet-schema";

import type { FacetDescriptor, FacetSelection } from "./types";

const TYPE_PARAM = "t";
const FILTER_PREFIX = "f.";

function encodeRange(gte?: number | string, lte?: number | string): string {
  const a = gte != null ? String(gte) : "";
  const b = lte != null ? String(lte) : "";
  return `${a}..${b}`;
}

function decodeRange(raw: string): {
  gte?: number | string;
  lte?: number | string;
} {
  const [a, b] = raw.split("..");
  const gte = a ? (Number.isFinite(Number(a)) ? Number(a) : a) : undefined;
  const lte = b ? (Number.isFinite(Number(b)) ? Number(b) : b) : undefined;
  return { gte, lte };
}

function scopeKey(descriptor: FacetDescriptor, singleType: boolean): string {
  if (singleType) return descriptor.field;
  return `${descriptor.typeName}.${descriptor.field}`;
}

export function serializeSelection(
  selection: FacetSelection,
  descriptors: FacetDescriptor[],
  typeNames: string[],
): URLSearchParams {
  const params = new URLSearchParams();
  if (typeNames.length > 0) {
    params.set(TYPE_PARAM, typeNames.join(","));
  }

  const byScope = new Map(descriptors.map((d) => [d.scope, d]));
  const singleType = typeNames.length === 1;

  for (const [scope, sel] of Object.entries(selection)) {
    const desc = byScope.get(scope as ScopePointer);
    if (!desc) continue;
    const key = `${FILTER_PREFIX}${scopeKey(desc, singleType)}`;
    if (sel.kind === "terms") {
      params.set(key, sel.values.map(String).join(","));
    } else {
      params.set(key, encodeRange(sel.gte, sel.lte));
    }
  }
  return params;
}

export function parseSelection(
  params: URLSearchParams,
  descriptors: FacetDescriptor[],
): { typeNames: string[]; selection: FacetSelection } {
  const typeNames = (params.get(TYPE_PARAM) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const singleType = typeNames.length === 1;
  const byKey = new Map<string, FacetDescriptor>();
  for (const d of descriptors) {
    byKey.set(scopeKey(d, singleType), d);
    byKey.set(scopeKey(d, false), d);
    byKey.set(d.field, d);
  }

  const selection: FacetSelection = {};
  for (const [key, raw] of params.entries()) {
    if (!key.startsWith(FILTER_PREFIX)) continue;
    const fieldKey = key.slice(FILTER_PREFIX.length);
    const desc = byKey.get(fieldKey);
    if (!desc) continue;

    if (desc.mode === "range" || raw.includes("..")) {
      selection[desc.scope] = { kind: "range", ...decodeRange(raw) };
    } else {
      const values = raw.split(",").filter(Boolean);
      selection[desc.scope] = {
        kind: "terms",
        values: values.map((v) =>
          Number.isFinite(Number(v)) && v.trim() !== "" ? Number(v) : v,
        ),
      };
    }
  }

  return { typeNames, selection };
}
