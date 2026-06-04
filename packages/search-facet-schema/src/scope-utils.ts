import type { ScopePointer, SearchFacetSchema } from "./types";

const DEFINITIONS_SEGMENT = "#/definitions/";
const PROPERTIES_SEGMENT = "/properties/";

/** Extract type name from a scope pointer like `#/definitions/Exhibition/properties/title`. */
export function typeFromScope(scope: ScopePointer): string | null {
  if (!scope.startsWith(DEFINITIONS_SEGMENT)) return null;
  const afterDef = scope.slice(DEFINITIONS_SEGMENT.length);
  const propIdx = afterDef.indexOf(PROPERTIES_SEGMENT);
  if (propIdx === -1) return null;
  const typeName = afterDef.slice(0, propIdx);
  return typeName || null;
}

/** Extract JSON Schema property name from a scope pointer. */
export function propertyNameFromScope(scope: ScopePointer): string | null {
  const idx = scope.lastIndexOf(PROPERTIES_SEGMENT);
  if (idx === -1) return null;
  return scope.slice(idx + PROPERTIES_SEGMENT.length) || null;
}

/** All type names marked searchable or referenced by fulltext scopes. */
export function listSearchableTypes(sidecar: SearchFacetSchema): string[] {
  const types = new Set<string>();

  for (const [scope] of Object.entries(sidecar.fulltextIndex?.scopes ?? {})) {
    const typeName = typeFromScope(scope);
    if (typeName) types.add(typeName);
  }

  for (const [typeName, cfg] of Object.entries(
    sidecar.fulltextIndex?.types ?? {},
  )) {
    if (cfg?.searchable !== false) {
      types.add(typeName);
    }
  }

  return [...types].sort();
}

/** Scope pointers belonging to a type (fulltext + facets). */
export function scopesForType(
  sidecar: SearchFacetSchema,
  typeName: string,
): {
  fulltext: ScopePointer[];
  facets: ScopePointer[];
} {
  const fulltext: ScopePointer[] = [];
  const facets: ScopePointer[] = [];

  for (const scope of Object.keys(sidecar.fulltextIndex?.scopes ?? {})) {
    if (typeFromScope(scope) === typeName) fulltext.push(scope);
  }

  for (const scope of Object.keys(sidecar.facets?.scopes ?? {})) {
    if (typeFromScope(scope) === typeName) facets.push(scope);
  }

  return { fulltext, facets };
}
