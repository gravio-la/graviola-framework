import type { JSONSchema7 } from "json-schema";
import type {
  FacetMode,
  ScopePointer,
  SearchFacetSchema,
} from "@graviola/search-facet-schema";
import {
  propertyNameFromScope,
  scopesForType,
  typeFromScope,
} from "@graviola/search-facet-schema";

import type { AvailableFacets, FacetDescriptor, FacetValueType } from "./types";

type DeriveFacetDescriptorsInput = {
  searchFacetSchema: SearchFacetSchema;
  schema: JSONSchema7;
  typeNames: string[];
  typeNameLabelMap?: Record<string, string>;
  available?: AvailableFacets;
};

function resolvePropertySchema(
  schema: JSONSchema7,
  typeName: string,
  field: string,
): JSONSchema7 | undefined {
  const def = schema.definitions?.[typeName] ?? schema.$defs?.[typeName];
  if (!def || typeof def !== "object") return undefined;
  const props = (def as JSONSchema7).properties;
  if (!props || typeof props !== "object") return undefined;
  const prop = props[field];
  return prop && typeof prop === "object" ? (prop as JSONSchema7) : undefined;
}

function inferValueType(
  propSchema: JSONSchema7 | undefined,
  kind?: string,
): FacetValueType {
  if (kind === "date") return "date-time";
  if (propSchema?.format === "date-time" || propSchema?.format === "date") {
    return "date-time";
  }
  if (propSchema?.$ref?.includes("#")) return "entity";
  const t = propSchema?.type;
  if (t === "integer") return "integer";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "string";
}

function isAvailable(
  available: AvailableFacets | undefined,
  typeName: string,
  field: string,
): boolean {
  if (!available) return true;
  const fields = available[typeName];
  if (!fields) return false;
  return fields.some((f) => f.field === field);
}

export function deriveFacetDescriptors(
  input: DeriveFacetDescriptorsInput,
): FacetDescriptor[] {
  const { searchFacetSchema, schema, typeNames, available } = input;
  const out: FacetDescriptor[] = [];

  for (const typeName of typeNames) {
    const { facets: facetScopes } = scopesForType(searchFacetSchema, typeName);
    for (const scope of facetScopes) {
      const field = propertyNameFromScope(scope);
      if (!field) continue;
      if (!isAvailable(available, typeName, field)) continue;

      const annotation = searchFacetSchema.facets?.scopes?.[scope];
      if (!annotation) continue;

      const propSchema = resolvePropertySchema(schema, typeName, field);
      const valueType = inferValueType(propSchema, annotation.kind);
      const title =
        typeof propSchema?.title === "string" ? propSchema.title : field;

      out.push({
        scope,
        typeName,
        field,
        mode: annotation.facet,
        valueType,
        label: annotation.label ?? title,
        kind: annotation.kind,
        order: annotation.order ?? 100,
        multi: annotation.multi ?? annotation.facet === "filter",
        maxValues: annotation.maxValues,
        quick: annotation.quick ?? false,
        numericField: annotation.numericField,
      });
    }
  }

  return out.sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label),
  );
}

export type GroupedDescriptors = {
  shared: FacetDescriptor[];
  byType: Record<string, FacetDescriptor[]>;
};

function descriptorSignature(d: FacetDescriptor): string {
  return `${d.field}|${d.mode}|${d.valueType}|${d.kind ?? ""}`;
}

export function groupDescriptors(
  descriptors: FacetDescriptor[],
): GroupedDescriptors {
  const byType: Record<string, FacetDescriptor[]> = {};
  for (const d of descriptors) {
    (byType[d.typeName] ??= []).push(d);
  }

  const typeNames = Object.keys(byType);
  if (typeNames.length <= 1) {
    return { shared: [], byType };
  }

  const sigCounts = new Map<string, FacetDescriptor[]>();
  for (const d of descriptors) {
    const sig = descriptorSignature(d);
    const list = sigCounts.get(sig) ?? [];
    list.push(d);
    sigCounts.set(sig, list);
  }

  const shared: FacetDescriptor[] = [];
  const sharedScopes = new Set<string>();
  for (const [, list] of sigCounts) {
    const typeSet = new Set(list.map((d) => d.typeName));
    if (typeSet.size === typeNames.length) {
      const rep = list[0]!;
      shared.push(rep);
      sharedScopes.add(rep.scope);
    }
  }

  const trimmedByType: Record<string, FacetDescriptor[]> = {};
  for (const [typeName, list] of Object.entries(byType)) {
    trimmedByType[typeName] = list.filter(
      (d) =>
        !shared.some((s) => descriptorSignature(s) === descriptorSignature(d)),
    );
  }

  return { shared, byType: trimmedByType };
}

export function scopeForField(
  typeName: string,
  field: string,
  searchFacetSchema: SearchFacetSchema,
): ScopePointer | undefined {
  for (const scope of Object.keys(searchFacetSchema.facets?.scopes ?? {})) {
    if (
      typeFromScope(scope) === typeName &&
      propertyNameFromScope(scope) === field
    ) {
      return scope;
    }
  }
  return undefined;
}

export function facetModeForField(
  typeName: string,
  field: string,
  available?: AvailableFacets,
): FacetMode | undefined {
  return available?.[typeName]?.find((f) => f.field === field)?.mode;
}
