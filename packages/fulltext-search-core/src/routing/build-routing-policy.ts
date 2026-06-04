import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type {
  FacetMode,
  ScopePointer,
  SearchFacetSchema,
} from "@graviola/search-facet-schema";
import {
  listSearchableTypes,
  propertyNameFromScope,
  scopesForType,
  typeFromScope,
} from "@graviola/search-facet-schema";

import type { FullTextSearchAdapter } from "../engine";
import { defaultIndexUid } from "../id-mapping";

export type FacetFieldSpec = {
  /** Schema property name */
  field: string;
  /** Index attribute name */
  indexField: string;
  mode: FacetMode;
};

export type TypeRouting = {
  typeName: string;
  indexUid: string;
  /** Whether this type has a full-text index (may be false if convention failed). */
  searchable: boolean;
  /** Schema property names used for full-text search */
  fulltextFields: string[];
  /** Index attribute names for full-text search */
  fulltextIndexFields: string[];
  facetFields: FacetFieldSpec[];
  /** Schema property → index attribute */
  propertyToIndexField: Map<string, string>;
};

export type RoutingPolicy = {
  types: Map<string, TypeRouting>;
};

export type BuildRoutingPolicyOptions = {
  sidecar: SearchFacetSchema;
  primaryFields?: PrimaryFieldDeclaration;
  scopeToIndexField?: Record<string, string>;
  indexNameForType?: (typeName: string) => string;
  adapter?: Pick<FullTextSearchAdapter, "sanitizeId">;
};

function resolveIndexFieldName(
  scope: ScopePointer,
  prop: string,
  overrides: Record<string, string> | undefined,
): string {
  return overrides?.[scope] ?? prop;
}

function buildTypeRouting(
  typeName: string,
  sidecar: SearchFacetSchema,
  options: BuildRoutingPolicyOptions,
): TypeRouting {
  const { primaryFields, scopeToIndexField, indexNameForType, adapter } =
    options;
  const { fulltext: fulltextScopes, facets: facetScopes } = scopesForType(
    sidecar,
    typeName,
  );

  const propertyToIndexField = new Map<string, string>();
  const fulltextFields: string[] = [];
  const facetFields: FacetFieldSpec[] = [];

  for (const scope of fulltextScopes) {
    const prop = propertyNameFromScope(scope);
    if (!prop) continue;
    const indexField = resolveIndexFieldName(scope, prop, scopeToIndexField);
    propertyToIndexField.set(prop, indexField);
    if (!fulltextFields.includes(prop)) fulltextFields.push(prop);
  }

  for (const scope of facetScopes) {
    const prop = propertyNameFromScope(scope);
    if (!prop) continue;
    const indexField = resolveIndexFieldName(scope, prop, scopeToIndexField);
    propertyToIndexField.set(prop, indexField);
    const facetCfg = sidecar.facets?.scopes?.[scope];
    if (facetCfg) {
      facetFields.push({
        field: prop,
        indexField,
        mode: facetCfg.facet,
      });
    }
  }

  // Convention: searchable type with no fulltext scopes → primaryFields label + description
  const markedSearchable =
    sidecar.fulltextIndex?.types?.[typeName]?.searchable === true;
  if (fulltextFields.length === 0 && markedSearchable && primaryFields) {
    const pf = primaryFields[typeName];
    if (pf?.label && !fulltextFields.includes(pf.label)) {
      fulltextFields.push(pf.label);
      propertyToIndexField.set(pf.label, pf.label);
    }
    if (pf?.description && !fulltextFields.includes(pf.description)) {
      fulltextFields.push(pf.description);
      propertyToIndexField.set(pf.description, pf.description);
    }
  }

  const fulltextIndexFields = fulltextFields.map(
    (f) => propertyToIndexField.get(f) ?? f,
  );

  const rawUid = indexNameForType?.(typeName) ?? defaultIndexUid(typeName);
  const indexUid = adapter?.sanitizeId?.(rawUid) ?? rawUid;

  const searchable =
    fulltextFields.length > 0 || fulltextScopes.length > 0 || markedSearchable;

  if (markedSearchable && fulltextFields.length === 0) {
    console.warn(
      `[fulltext-search-core] Type "${typeName}" is marked searchable but has no fulltext scopes and no primaryFields label/description — skipped for FT index.`,
    );
  }

  return {
    typeName,
    indexUid,
    searchable: searchable && fulltextFields.length > 0,
    fulltextFields,
    fulltextIndexFields: [...new Set(fulltextIndexFields)],
    facetFields,
    propertyToIndexField,
  };
}

/**
 * Build per-type routing maps from a validated {@link SearchFacetSchema} sidecar.
 */
export function buildRoutingPolicy(
  options: BuildRoutingPolicyOptions,
): RoutingPolicy {
  const { sidecar } = options;
  const typeNames = new Set<string>(listSearchableTypes(sidecar));

  // Types appearing only in facet scopes also need routing entries (facets without FT)
  for (const scope of Object.keys(sidecar.facets?.scopes ?? {})) {
    const t = typeFromScope(scope);
    if (t) typeNames.add(t);
  }

  const types = new Map<string, TypeRouting>();
  for (const typeName of typeNames) {
    types.set(typeName, buildTypeRouting(typeName, sidecar, options));
  }

  return { types };
}

export function getTypeRouting(
  policy: RoutingPolicy,
  typeName: string,
): TypeRouting | undefined {
  return policy.types.get(typeName);
}

export function isFulltextType(
  policy: RoutingPolicy,
  typeName: string,
): boolean {
  return policy.types.get(typeName)?.searchable === true;
}

export function resolveIndexField(
  policy: RoutingPolicy,
  typeName: string,
  propertyOrScope: string,
): string | undefined {
  const routing = policy.types.get(typeName);
  if (!routing) return undefined;

  if (propertyOrScope.startsWith("#/")) {
    const prop = propertyNameFromScope(propertyOrScope);
    return prop ? routing.propertyToIndexField.get(prop) : undefined;
  }
  return routing.propertyToIndexField.get(propertyOrScope);
}

export function isFulltextProperty(
  policy: RoutingPolicy,
  typeName: string,
  propertyName: string,
): boolean {
  const routing = policy.types.get(typeName);
  return routing?.fulltextFields.includes(propertyName) ?? false;
}

export function isFacetProperty(
  policy: RoutingPolicy,
  typeName: string,
  propertyName: string,
): boolean {
  const routing = policy.types.get(typeName);
  return routing?.facetFields.some((f) => f.field === propertyName) ?? false;
}

export { propertyNameFromScope, typeFromScope };
