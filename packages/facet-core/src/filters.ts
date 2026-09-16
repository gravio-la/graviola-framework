import type { FacetFilter } from "@graviola/store-core";
import type { ScopePointer } from "@graviola/search-facet-schema";

import type { FacetDescriptor, FacetSelection } from "./types";

function isoToEpochSeconds(iso: string): number | undefined {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined;
}

export function selectionToFacetFilters(
  selection: FacetSelection,
  descriptors: FacetDescriptor[],
  typeName: string,
): FacetFilter[] {
  const byScope = new Map(descriptors.map((d) => [d.scope, d]));
  const filters: FacetFilter[] = [];

  for (const [scope, sel] of Object.entries(selection)) {
    const desc = byScope.get(scope as ScopePointer);
    if (!desc || desc.typeName !== typeName) continue;

    if (sel.kind === "terms") {
      if (sel.values.length === 0) continue;
      if (sel.values.length === 1) {
        filters.push({ field: desc.field, value: sel.values[0]! });
      } else {
        filters.push({ field: desc.field, values: sel.values });
      }
      continue;
    }

    if (desc.valueType === "date-time" && desc.numericField) {
      const gte =
        typeof sel.gte === "string"
          ? isoToEpochSeconds(sel.gte)
          : typeof sel.gte === "number"
            ? sel.gte
            : undefined;
      const lte =
        typeof sel.lte === "string"
          ? isoToEpochSeconds(sel.lte)
          : typeof sel.lte === "number"
            ? sel.lte
            : undefined;
      if (gte != null || lte != null) {
        filters.push({
          field: desc.field,
          gte,
          lte,
        });
      }
      continue;
    }

    const gte = typeof sel.gte === "number" ? sel.gte : undefined;
    const lte = typeof sel.lte === "number" ? sel.lte : undefined;
    if (gte != null || lte != null) {
      filters.push({ field: desc.field, gte, lte });
    }
  }

  return filters;
}

export function facetFieldNamesForSelection(
  selection: FacetSelection,
  descriptors: FacetDescriptor[],
  typeName: string,
): string[] {
  const byScope = new Map(descriptors.map((d) => [d.scope, d]));
  const fields: string[] = [];
  for (const scope of Object.keys(selection)) {
    const desc = byScope.get(scope as ScopePointer);
    if (desc?.typeName === typeName && !fields.includes(desc.field)) {
      fields.push(desc.field);
    }
  }
  return fields;
}

/** Best-effort TypedWhere → FacetFilter for simple equality/range/in clauses. */
export function typedWhereToFacetFilters(
  where: Record<string, unknown> | undefined,
): FacetFilter[] {
  if (!where) return [];
  const filters: FacetFilter[] = [];

  for (const [field, raw] of Object.entries(where)) {
    if (field === "AND" || field === "OR" || field === "NOT") continue;
    if (raw == null || typeof raw !== "object") continue;
    const ops = raw as Record<string, unknown>;

    if ("equals" in ops && ops.equals != null) {
      filters.push({
        field,
        value: ops.equals as string | number | boolean,
      });
    } else if ("in" in ops && Array.isArray(ops.in)) {
      filters.push({
        field,
        values: ops.in as (string | number | boolean)[],
      });
    } else if ("gte" in ops || "lte" in ops || "gt" in ops || "lt" in ops) {
      filters.push({
        field,
        gte: (ops.gte ?? ops.gt) as number | undefined,
        lte: (ops.lte ?? ops.lt) as number | undefined,
      });
    }
  }
  return filters;
}
