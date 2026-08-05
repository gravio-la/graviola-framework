import { sha256HexSync } from "./sha256Sync";

/**
 * Canonical JSON for content-hashing list members.
 * - objects: sorted keys, `@id` excluded
 * - arrays: element-wise
 * - primitives: JSON.stringify
 */
export function canonicalMemberJSON(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalMemberJSON).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => k !== "@id")
    .sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalMemberJSON(obj[k])}`)
    .join(",")}}`;
}

export function contentHash8(value: unknown): string {
  return sha256HexSync(canonicalMemberJSON(value)).slice(0, 8);
}

/**
 * Deterministic skolem IRI for a multi-value list member.
 *
 * `${rootEntityIRI}#${propertyPath}/${hash8}` with optional `~n` suffix
 * for identical siblings (first occurrence has no suffix; second is `~1`).
 *
 * For nested lists under an anonymous parent, include the parent's hash
 * in the path (e.g. `media/abcd1234/copyright/notes`).
 */
export function skolemListMemberIri(
  rootEntityIRI: string,
  propertyPath: string,
  member: unknown,
  duplicateIndex = 0,
): string {
  const hash = contentHash8(member);
  const base = `${rootEntityIRI}#${propertyPath}/${hash}`;
  return duplicateIndex > 0 ? `${base}~${duplicateIndex}` : base;
}

/**
 * Assign skolem IRIs to every member of a list, handling duplicate content.
 */
export function assignSkolemIris<T>(
  rootEntityIRI: string,
  propertyPath: string,
  members: T[],
): Array<{ member: T; iri: string; hash: string }> {
  const seen = new Map<string, number>();
  return members.map((member) => {
    const hash = contentHash8(member);
    const count = seen.get(hash) ?? 0;
    seen.set(hash, count + 1);
    const iri = skolemListMemberIri(rootEntityIRI, propertyPath, member, count);
    return { member, iri, hash };
  });
}
