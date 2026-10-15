import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import get from "lodash-es/get";

/** Matches {@link findEntityByClass} COALESCE order when `primaryFields` is absent. */
export const LINKED_REFERENCE_LABEL_FALLBACK_KEYS = [
  "name",
  "title",
  "label",
  "prefLabel",
] as const;

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeOpaqueId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (UUID_LIKE.test(trimmed)) return true;
  if (/^urn:uuid:/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("urn:")) return true;
  return false;
}

function readDisplayString(data: unknown, key: string): string | undefined {
  if (data == null || typeof data !== "object") return undefined;
  const value = get(data as Record<string, unknown>, key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || looksLikeOpaqueId(trimmed)) return undefined;
  return trimmed;
}

/**
 * Property name used when persisting a denormalized label on embedded reference
 * objects. Aligns with SPARQL entity search (`findEntityByClass` uses `:name`
 * when no `gra:primaryLabel` is declared).
 */
export function resolveLinkedReferenceLabelKey(
  typeName: string | undefined,
  primaryFields?: PrimaryFieldDeclaration,
): string {
  if (typeName) {
    const declared = primaryFields?.[typeName]?.label;
    if (typeof declared === "string" && declared.length > 0) {
      return declared;
    }
  }
  return "name";
}

export function resolveLinkedReferenceLabel(input: {
  data: unknown;
  typeName?: string;
  primaryFields?: PrimaryFieldDeclaration;
  labelKey?: string;
  /** Accept `label` / `__label` on finder or mapped payloads. */
  includeLegacyLabelFields?: boolean;
}): string | undefined {
  const {
    data,
    typeName,
    primaryFields,
    includeLegacyLabelFields = true,
  } = input;
  const labelKey =
    input.labelKey ?? resolveLinkedReferenceLabelKey(typeName, primaryFields);

  const primary = readDisplayString(data, labelKey);
  if (primary) return primary;

  if (includeLegacyLabelFields && data && typeof data === "object") {
    for (const legacyKey of ["label", "__label"] as const) {
      const legacy = readDisplayString(data, legacyKey);
      if (legacy) return legacy;
    }
  }

  for (const fallbackKey of LINKED_REFERENCE_LABEL_FALLBACK_KEYS) {
    if (fallbackKey === labelKey) continue;
    const candidate = readDisplayString(data, fallbackKey);
    if (candidate) return candidate;
  }

  return undefined;
}

export function buildLinkedReferenceObject(input: {
  entityIRI: string;
  typeIRI?: string;
  entityData?: unknown;
  typeName?: string;
  primaryFields?: PrimaryFieldDeclaration;
  suggestionLabel?: string | null;
}): Record<string, unknown> {
  const labelKey = resolveLinkedReferenceLabelKey(
    input.typeName,
    input.primaryFields,
  );
  const fromSuggestion = input.suggestionLabel?.trim();
  const label =
    (fromSuggestion && !looksLikeOpaqueId(fromSuggestion)
      ? fromSuggestion
      : undefined) ??
    resolveLinkedReferenceLabel({
      data: input.entityData,
      typeName: input.typeName,
      primaryFields: input.primaryFields,
      labelKey,
    }) ??
    input.entityIRI;

  return {
    "@id": input.entityIRI,
    ...(input.typeIRI ? { "@type": input.typeIRI } : {}),
    [labelKey]: label,
  };
}
