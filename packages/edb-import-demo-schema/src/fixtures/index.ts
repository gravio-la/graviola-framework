import wikidataQ5879 from "./wikidata-Q5879.json";
import wikidataQ1794 from "./wikidata-Q1794.json";
import wikidataQ7932 from "./wikidata-Q7932.json";
import wikidataQ1199 from "./wikidata-Q1199.json";
import wikidataQ183 from "./wikidata-Q183.json";
import wikidataQ1776724 from "./wikidata-Q1776724.json";
import wikidataQ2374149 from "./wikidata-Q2374149.json";
import lobid118540238 from "./lobid-118540238.json";
import slubGnd118559796 from "./slub-gnd-118559796.json";
import slubGeo104254033 from "./slub-geo-104254033.json";
import { unwrapSlubLodResponse } from "../mappings/slubLodAccess";

const kantPerson = unwrapSlubLodResponse(slubGnd118559796);
const konigsbergGeo = unwrapSlubLodResponse(slubGeo104254033);

/** Offline authority records keyed by full authority entity IRI. */
export const fixtureAuthorityRecords: Record<string, unknown> = {
  "http://www.wikidata.org/entity/Q5879": wikidataQ5879,
  "http://www.wikidata.org/entity/Q1794": wikidataQ1794,
  "http://www.wikidata.org/entity/Q7932": wikidataQ7932,
  "http://www.wikidata.org/entity/Q1199": wikidataQ1199,
  "http://www.wikidata.org/entity/Q183": wikidataQ183,
  "http://www.wikidata.org/entity/Q1776724": wikidataQ1776724,
  "http://www.wikidata.org/entity/Q2374149": wikidataQ2374149,
  "https://d-nb.info/gnd/118540238": lobid118540238,
  "http://d-nb.info/gnd/118540238": lobid118540238,
  "https://data.slub-dresden.de/gnd/118559796": kantPerson,
  "https://data.slub-dresden.de/persons/133368785": kantPerson,
  "https://data.slub-dresden.de/geo/104254033": konigsbergGeo,
};

export const PERSON_WIKIDATA_IRI = "http://www.wikidata.org/entity/Q5879";
export const PERSON_LOBID_IRI = "https://d-nb.info/gnd/118540238";
export const PERSON_SLUB_IRI = "https://data.slub-dresden.de/gnd/118559796";
