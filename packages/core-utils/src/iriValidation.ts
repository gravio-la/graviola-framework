const IRI_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;

/** Characters forbidden in a SPARQL/Turtle IRIREF, plus U+0000–U+0020. */
const FORBIDDEN_IRI_CHAR_RE = /[<>"{}|^`\\]|[\u0000- ]/;

/** Thrown when a value is not an absolute IRI that can be safely serialized. */
export class InvalidIriError extends Error {
  override name = "InvalidIriError";

  constructor(public readonly value: string) {
    const truncated = value.length > 200 ? `${value.slice(0, 200)}…` : value;
    super(`Invalid IRI: ${truncated}`);
  }
}

/**
 * True for an absolute IRI (with scheme) without characters that would let it
 * break out of `<…>` in SPARQL or Turtle. Validate every IRI that comes from
 * requests or stored data before it reaches query text.
 */
export const isSafeIri = (value: string): boolean =>
  typeof value === "string" &&
  IRI_SCHEME_RE.test(value) &&
  !FORBIDDEN_IRI_CHAR_RE.test(value);

/** Throws {@link InvalidIriError} unless {@link isSafeIri} holds. */
export const assertSafeIri = (value: string): string => {
  if (!isSafeIri(value)) throw new InvalidIriError(value);
  return value;
};
