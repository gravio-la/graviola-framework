/**
 * Readable fallback when no primary-field label is available: last path or fragment segment.
 */
export function shortLabelForIri(iri: string): string {
  const trimmed = iri.trim();
  if (!trimmed) return trimmed;
  const noFragment = trimmed.split("#").pop() || trimmed;
  const segment = noFragment.split("/").filter(Boolean).pop();
  return segment || trimmed;
}
