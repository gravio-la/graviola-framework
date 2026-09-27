import type { Calc, CapabilityDescriptor } from "@graviola/store-core";

export type CalcEnrichStore = Partial<Calc> & {
  capabilities?: CapabilityDescriptor;
};

function canEnrichCalc(
  store: CalcEnrichStore,
): store is CalcEnrichStore & Required<Pick<Calc, "readCalcValues">> {
  return (
    store.capabilities?.calc === true &&
    typeof store.readCalcValues === "function"
  );
}

function isCalcRootType(store: CalcEnrichStore, typeName: string): boolean {
  const rootTypes = store.capabilities?.profiles?.calc?.rootTypes;
  return Array.isArray(rootTypes) && rootTypes.includes(typeName);
}

function mergeCalcEntry(
  entity: Record<string, unknown>,
  entry: { data: Record<string, unknown> | null } | undefined,
): Record<string, unknown> {
  if (!entry || entry.data == null || typeof entry.data !== "object") {
    return entity;
  }
  return { ...entity, ...entry.data };
}

/**
 * Build an `enrichEntityForIndex` callback that merges materialized calc values
 * when the primary store exposes `capabilities.calc` + `readCalcValues`.
 *
 * Kept outside calc-engine so `@graviola/fulltext-search-core` stays free of
 * formula packages — the CLI / app wires this when calc is configured.
 */
export function createCalcEnrichEntityForIndex(
  store: CalcEnrichStore,
): (
  typeName: string,
  entity: Record<string, unknown>,
) => Promise<Record<string, unknown>> {
  return async (typeName, entity) => {
    if (!canEnrichCalc(store) || !isCalcRootType(store, typeName)) {
      return entity;
    }
    const iri = typeof entity["@id"] === "string" ? entity["@id"] : null;
    if (!iri) return entity;
    try {
      const entries = await store.readCalcValues(typeName, [iri]);
      return mergeCalcEntry(entity, entries[0]);
    } catch {
      return entity;
    }
  };
}

/**
 * Batch enricher for index import paths that process entities in chunks
 * (`importMany`). Calls `readCalcValues(typeName, iris)` once per chunk.
 */
export function createCalcEnrichEntitiesForIndex(
  store: CalcEnrichStore,
): (
  typeName: string,
  entities: Record<string, unknown>[],
) => Promise<Record<string, unknown>[]> {
  return async (typeName, entities) => {
    if (!canEnrichCalc(store) || !isCalcRootType(store, typeName)) {
      return entities;
    }

    const iris: string[] = [];
    for (const entity of entities) {
      const iri = typeof entity["@id"] === "string" ? entity["@id"] : null;
      if (iri) iris.push(iri);
    }
    if (iris.length === 0) return entities;

    try {
      const entries = await store.readCalcValues(typeName, iris);
      const byIri = new Map(entries.map((entry) => [entry.entityIRI, entry]));
      return entities.map((entity) => {
        const iri = typeof entity["@id"] === "string" ? entity["@id"] : null;
        if (!iri) return entity;
        return mergeCalcEntry(entity, byIri.get(iri));
      });
    } catch {
      return entities;
    }
  };
}
