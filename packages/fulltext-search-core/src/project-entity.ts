import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";

import { INDEX_DOC_IRI, INDEX_DOC_TYPE } from "./constants";
import type { IndexDocument } from "./engine";
import { encodeIriToDocId } from "./id-mapping";
import type { TypeRouting } from "./routing/build-routing-policy";

function extractScalar(value: unknown): unknown {
  if (value == null) return value;
  // HyperFormula DetailedCellError leaked into materialization / Meili
  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "value" in value &&
    (value as { value?: unknown }).value === "#NAME?"
  ) {
    return undefined;
  }
  if (typeof value === "object" && value !== null && "@id" in value) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj["@id"] === "string") return obj["@id"];
  }
  return value;
}

function getNestedLabel(
  value: unknown,
  primaryFields: PrimaryFieldDeclaration | undefined,
  refTypeHint?: string,
): unknown {
  if (value == null || typeof value !== "object") return extractScalar(value);
  const obj = value as Record<string, unknown>;
  if (refTypeHint && primaryFields?.[refTypeHint]?.label) {
    const labelField = primaryFields[refTypeHint].label!;
    if (labelField in obj) return obj[labelField];
  }
  return extractScalar(value);
}

/** All schema properties indexed for a type (fulltext + facets). */
export function indexedPropertyNames(routing: TypeRouting): string[] {
  const names = new Set<string>();
  for (const f of routing.fulltextFields) names.add(f);
  for (const f of routing.facetFields) names.add(f.field);
  return [...names];
}

/**
 * Project an entity into an index document (FT + facet fields only).
 */
export function projectEntityToIndexDoc(
  entity: Record<string, unknown>,
  routing: TypeRouting,
  options: {
    typeIri: string;
    primaryFields?: PrimaryFieldDeclaration;
    encodeId?: (iri: string) => string;
  },
): IndexDocument {
  const iri = String(entity["@id"] ?? "");
  if (!iri) {
    throw new Error("Entity missing @id for full-text index projection");
  }

  const encode = options.encodeId ?? encodeIriToDocId;
  const doc: IndexDocument = {
    id: encode(iri),
    [INDEX_DOC_IRI]: iri,
    [INDEX_DOC_TYPE]: options.typeIri,
  };

  for (const prop of indexedPropertyNames(routing)) {
    if (!(prop in entity)) continue;
    const raw = entity[prop];
    const indexField = routing.propertyToIndexField.get(prop) ?? prop;
    const projected = getNestedLabel(raw, options.primaryFields);
    // Skip HyperFormula #NAME? leaks (extractScalar → undefined)
    if (projected === undefined) continue;
    doc[indexField] = projected;
  }

  // If primary label was skipped (bad calc object), fall back to `name`.
  const typeHint =
    typeof entity["@type"] === "string"
      ? entity["@type"].replace(/^.*[#/]/, "")
      : undefined;
  const labelProp =
    typeHint && options.primaryFields?.[typeHint]?.label
      ? options.primaryFields[typeHint]!.label!
      : undefined;
  if (labelProp && typeof entity.name === "string") {
    const indexField = routing.propertyToIndexField.get(labelProp) ?? labelProp;
    if (doc[indexField] === undefined) {
      doc[indexField] = entity.name;
    }
  }

  return doc;
}
