/**
 * Build an `enrichEntityForIndex` callback that merges materialized calc values
 * when the primary store exposes `capabilities.calc` + `readCalcValues`.
 *
 * Kept outside calc-engine so `@graviola/fulltext-search-core` stays free of
 * formula packages — the CLI / app wires this when calc is configured.
 */
export function createCalcEnrichEntityForIndex(store: {
  capabilities?: { calc?: boolean };
  readCalcValues?: (
    rootIRI: string,
  ) => Promise<{ value: Record<string, unknown> | null }>;
}): (
  typeName: string,
  entity: Record<string, unknown>,
) => Promise<Record<string, unknown>> {
  return async (_typeName, entity) => {
    if (
      !store.capabilities?.calc ||
      typeof store.readCalcValues !== "function"
    ) {
      return entity;
    }
    const iri = typeof entity["@id"] === "string" ? entity["@id"] : null;
    if (!iri) return entity;
    try {
      const result = await store.readCalcValues(iri);
      if (!result.value || typeof result.value !== "object") return entity;
      return { ...entity, ...result.value };
    } catch {
      return entity;
    }
  };
}
