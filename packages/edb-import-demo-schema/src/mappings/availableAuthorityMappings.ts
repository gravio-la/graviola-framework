import { NormDataMappings } from "@graviola/edb-core-types";
import { DeclarativeMapping } from "@graviola/edb-data-mapping";
import { wikidataMappings, wikidataTypeMap } from "./wikidataMappings";
import { lobidMappings, lobidTypemap } from "./lobidMappings";
import { slubLodMappings, slubLodTypeMap } from "./slubLodMappings";
import { SLUB_LOD_AUTHORITY } from "./slubLodAccess";

export const availableAuthorityMappings: NormDataMappings<DeclarativeMapping> =
  {
    "http://www.wikidata.org": {
      label: "Wikidata",
      sameAsTypeMap: wikidataTypeMap,
      mapping: wikidataMappings,
    },
    "http://d-nb.info/gnd": {
      label: "GND",
      sameAsTypeMap: lobidTypemap,
      mapping: lobidMappings,
    },
    [SLUB_LOD_AUTHORITY]: {
      label: "SLUB LOD",
      sameAsTypeMap: slubLodTypeMap,
      mapping: slubLodMappings,
    },
  } as const;
