import type { AuthorityConfiguration } from "@graviola/edb-data-mapping";
import { SLUB_LOD_AUTHORITY } from "./mappings/slubLodAccess";
import { fixtureAuthorityRecords } from "./fixtures";

const normalizeIri = (iri: string): string => {
  if (iri.startsWith("http://d-nb.info/gnd/")) {
    return iri.replace("http://", "https://");
  }
  return iri;
};

const lookupFixture = (iri: string): unknown => {
  const direct = fixtureAuthorityRecords[iri];
  if (direct !== undefined) return direct;
  const normalized = normalizeIri(iri);
  const normalizedHit = fixtureAuthorityRecords[normalized];
  if (normalizedHit !== undefined) return normalizedHit;
  throw new Error(
    `No fixture for authority IRI "${iri}". Available IRIs:\n${Object.keys(fixtureAuthorityRecords).join("\n")}`,
  );
};

export const fixtureAuthorityAccess: Record<string, AuthorityConfiguration> = {
  "http://d-nb.info/gnd": {
    authorityIRI: "http://d-nb.info/gnd",
    getEntityByIRI: async (iri: string) => lookupFixture(iri),
  },
  "http://www.wikidata.org": {
    authorityIRI: "http://www.wikidata.org",
    getEntityByIRI: async (iri: string) => lookupFixture(iri),
  },
  [SLUB_LOD_AUTHORITY]: {
    authorityIRI: SLUB_LOD_AUTHORITY,
    getEntityByIRI: async (iri: string) => lookupFixture(iri),
  },
};
