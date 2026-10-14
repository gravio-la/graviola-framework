import get from "lodash-es/get";

const DEFAULT_MAX_LENGTH = 60;

function lastSegmentOfIri(iri: string): string {
  const segment = iri.split(/[#/]/).filter(Boolean).pop();
  if (!segment) return iri;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Format one array-item field value for collapsed inline-object labels. */
export function formatInlineArrayElementLabelValue(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "object" || Array.isArray(value)) return undefined;

  const obj = value as Record<string, unknown>;
  for (const key of ["__label", "label", "prefLabel"] as const) {
    const candidate = obj[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  const id = obj["@id"];
  if (typeof id === "string" && id.trim()) {
    return lastSegmentOfIri(id);
  }
  return undefined;
}

export type ComposeInlineArrayElementLabelOptions = {
  maxLength?: number;
  joiner?: string;
};

/**
 * Join non-empty label candidates from an inline array item object (rank order).
 */
export function composeInlineArrayElementLabel(
  data: unknown,
  propNames: string[] | undefined,
  options?: ComposeInlineArrayElementLabelOptions,
): string | undefined {
  if (!propNames?.length || data == null || typeof data !== "object") {
    return undefined;
  }

  const joiner = options?.joiner ?? " ";
  const parts: string[] = [];
  for (const propName of propNames) {
    const part = formatInlineArrayElementLabelValue(get(data, propName));
    if (part) parts.push(part);
  }
  if (parts.length === 0) return undefined;

  let result = parts.join(joiner);
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  if (result.length > maxLength) {
    result = `${result.slice(0, maxLength - 1).trimEnd()}…`;
  }
  return result;
}
