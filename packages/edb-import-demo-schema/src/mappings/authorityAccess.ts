import { AuthorityConfiguration } from "@graviola/edb-data-mapping";
import { getEntityFromWikidataByIRI } from "@graviola/edb-wikidata-utils";
import { findEntityWithinLobidByIRI } from "@graviola/edb-authorities";
import { getEntityFromSlubLodByIRI, SLUB_LOD_AUTHORITY } from "./slubLodAccess";

export const authorityAccess: Record<string, AuthorityConfiguration> = {
  "http://d-nb.info/gnd": {
    authorityIRI: "http://d-nb.info/gnd",
    getEntityByIRI: findEntityWithinLobidByIRI,
  },
  "http://www.wikidata.org": {
    authorityIRI: "http://www.wikidata.org",
    getEntityByIRI: async (id) =>
      await getEntityFromWikidataByIRI(id, { rank: "preferred" }),
  },
  [SLUB_LOD_AUTHORITY]: {
    authorityIRI: SLUB_LOD_AUTHORITY,
    getEntityByIRI: getEntityFromSlubLodByIRI,
  },
};
