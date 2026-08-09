import { INDEX_DOC_IRI, INDEX_DOC_TYPE } from "./constants";
import { decodeDocIdToIri } from "./id-mapping";
import type { TypeRouting } from "./routing/build-routing-policy";

export type JsonLdEntity = Record<string, unknown> & {
  "@id": string;
  "@type": string;
};

/** Minimal hit shape — avoid coupling DTS to `./engine` re-exports. */
type SearchIndexHit = {
  id: string;
  document: Record<string, unknown>;
};

/** Reverse-map index field names → schema property names. */
function indexFieldToProperty(routing: TypeRouting): Map<string, string> {
  const map = new Map<string, string>();
  for (const [prop, indexField] of routing.propertyToIndexField) {
    map.set(indexField, prop);
  }
  return map;
}

const INTERNAL_KEYS = new Set(["id", INDEX_DOC_IRI, INDEX_DOC_TYPE]);

function isHyperFormulaNameError(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "value" in value &&
    (value as { value?: unknown }).value === "#NAME?"
  );
}

/**
 * Turn a text-index hit into a JSON-LD stub document with `@id` and `@type`.
 */
export function hitToJsonLd(
  hit: SearchIndexHit,
  routing: TypeRouting,
  options: { typeIri: string; decodeId?: (id: string) => string },
): JsonLdEntity {
  const doc = hit.document;
  const decode = options.decodeId ?? decodeDocIdToIri;

  const iri =
    (typeof doc[INDEX_DOC_IRI] === "string" ? doc[INDEX_DOC_IRI] : null) ??
    decode(hit.id);
  const typeIri =
    (typeof doc[INDEX_DOC_TYPE] === "string" ? doc[INDEX_DOC_TYPE] : null) ??
    options.typeIri;

  const indexToProp = indexFieldToProperty(routing);
  const result: JsonLdEntity = {
    "@id": iri,
    "@type": typeIri,
  };

  for (const [key, value] of Object.entries(doc)) {
    if (INTERNAL_KEYS.has(key)) continue;
    if (isHyperFormulaNameError(value)) continue;
    const prop = indexToProp.get(key) ?? key;
    result[prop] = value;
  }

  return result;
}

/** Shallow-merge hydrated RDF over stub (hydrated wins on conflict). */
export function mergeHydratedStub<T extends JsonLdEntity>(
  stub: T,
  hydrated: Record<string, unknown> | null | undefined,
): T {
  if (!hydrated) return stub;
  const cleanedStub = { ...stub } as Record<string, unknown>;
  for (const [key, value] of Object.entries(cleanedStub)) {
    if (isHyperFormulaNameError(value)) delete cleanedStub[key];
  }
  return {
    ...cleanedStub,
    ...hydrated,
    "@id": stub["@id"],
    "@type": stub["@type"],
  } as T;
}
