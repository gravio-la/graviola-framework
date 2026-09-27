import type { NamedAndTypedEntity } from "@graviola/edb-core-types";

export const irisToData = (
  entityIRI?: string,
  typeIRI?: string,
): Partial<NamedAndTypedEntity> => ({
  ...(entityIRI ? { "@id": entityIRI } : {}),
  ...(typeIRI ? { "@type": typeIRI } : {}),
});
