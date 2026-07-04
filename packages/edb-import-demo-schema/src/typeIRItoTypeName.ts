import { BASE_IRI } from "./schema";

export const typeIRItoTypeName = (iri: string): string => {
  return iri.substring(BASE_IRI.length);
};
