import { getViaSourcePath } from "@graviola/edb-data-mapping";

import type { IdentifierSpec, ReconciliationHit } from "./types";

export function reconcileFromDocument(
  document: unknown,
  identifiers: IdentifierSpec[] | undefined,
): ReconciliationHit[] {
  if (!identifiers?.length || document == null) return [];

  const hits: ReconciliationHit[] = [];
  for (const spec of identifiers) {
    const value = getViaSourcePath(document, spec.path);
    if (value == null || value === "") continue;
    const id = String(value);
    const iri = spec.iriTemplate.replace("{{id}}", id);
    hits.push({ authorityIRI: spec.authorityIRI, iri });
  }
  return hits;
}
