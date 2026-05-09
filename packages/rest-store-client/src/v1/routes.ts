import type { GraviolaIriHandlingMode } from "../handshake-types";

export const encodePathSegment = (value: string): string => {
  return encodeURIComponent(value);
};

export const entityRelativePath = (
  typeName: string,
  entityIRI: string,
  mode: GraviolaIriHandlingMode,
  localIdFromIri?: (iri: string) => string,
): string => {
  const encType = encodePathSegment(typeName);
  if (mode === "localId") {
    if (!localIdFromIri) {
      throw new Error(
        "RESTClientStore iriHandling=localId requires localIdFromIri(iri) callback",
      );
    }
    const local = localIdFromIri(entityIRI);
    return `${encType}/${encodePathSegment(local)}`;
  }
  return `${encType}/${encodePathSegment(entityIRI)}`;
};
