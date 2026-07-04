import { mapByConfig } from "@graviola/edb-data-mapping";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import {
  availableAuthorityMappings,
  BASE_IRI,
  fixtureAuthorityAccess,
  liveFirstAuthorityAccess,
  primaryFields,
  typeIRItoTypeName,
} from "@graviola/edb-import-demo-schema";
import {
  makeStagingStrategyContext,
  type StagedChangeSet,
} from "@graviola/edb-import-staging";
import { createEntityIRI, createEntityIRIFromTypeIRI } from "./entityIri";
import { buildSafeMainStoreProbe } from "./mainStoreProbe";

const SLUB_LOD_AUTHORITY = "https://data.slub-dresden.de";

const MAPPING_ID_BY_AUTHORITY: Record<string, (typeName: string) => string> = {
  "http://www.wikidata.org": (typeName) => `wikidata/${typeName}`,
  "http://d-nb.info/gnd": (typeName) => `gnd/${typeName}`,
  [SLUB_LOD_AUTHORITY]: (typeName) => `slub/${typeName}`,
};

function resolveAuthorityKey(entityIri: string): string {
  if (entityIri.includes("wikidata.org")) {
    return "http://www.wikidata.org";
  }
  if (
    entityIri.includes("data.slub-dresden.de") ||
    entityIri.startsWith("gnd:")
  ) {
    return SLUB_LOD_AUTHORITY;
  }
  if (entityIri.includes("d-nb.info/gnd") || entityIri.includes("lobid")) {
    return "http://d-nb.info/gnd";
  }
  throw new Error(
    `Cannot infer authority registry key from entity IRI "${entityIri}". Use a Wikidata, GND/lobid, or SLUB LOD entity IRI.`,
  );
}

export type ImportIntoSessionOptions = {
  changeSet: StagedChangeSet;
  dataStore: AbstractDatastore;
  typeName: string;
  authorityEntityIRI: string;
};

export async function importIntoSession(
  options: ImportIntoSessionOptions,
): Promise<{ rootIRI: string; staged: number }> {
  const { changeSet, dataStore, typeName, authorityEntityIRI } = options;
  const authorityKey = resolveAuthorityKey(authorityEntityIRI);
  const authorityBundle = availableAuthorityMappings[authorityKey];
  if (!authorityBundle) {
    throw new Error(
      `No mapping bundle registered for authority ${authorityKey}`,
    );
  }

  const mapping = authorityBundle.mapping[typeName];
  if (!mapping) {
    throw new Error(
      `No ${authorityBundle.label} mapping for type "${typeName}". Available: ${Object.keys(authorityBundle.mapping).join(", ")}`,
    );
  }

  // Live Wikidata/lobid endpoints with fixture fallback; set
  // IMPORT_AUTHORITY_SOURCE=fixtures for fully offline operation.
  const access =
    process.env.IMPORT_AUTHORITY_SOURCE === "fixtures"
      ? fixtureAuthorityAccess
      : liveFirstAuthorityAccess;
  const authorityConfig = access[authorityKey];
  if (!authorityConfig) {
    throw new Error(`No authority access configured for ${authorityKey}`);
  }

  const entryData = await authorityConfig.getEntityByIRI(authorityEntityIRI);
  if (!entryData) {
    throw new Error(`No authority record found for ${authorityEntityIRI}`);
  }

  const rootIRI = createEntityIRI(typeName);
  const mappingIdFn = MAPPING_ID_BY_AUTHORITY[authorityKey];
  if (!mappingIdFn) {
    throw new Error(
      `No mapping id prefix registered for authority ${authorityKey}`,
    );
  }
  const mappingId = mappingIdFn(typeName);

  const strategyContext = makeStagingStrategyContext({
    changeSet,
    mainStore: buildSafeMainStoreProbe(dataStore),
    mappingId,
    sourceRef: authorityEntityIRI,
    rootIRI,
    createEntityIRI: createEntityIRIFromTypeIRI,
    typeIRItoTypeName,
    primaryFields,
    normDataMappings: availableAuthorityMappings,
    authorityAccess: access,
  });

  const mappedRoot = await mapByConfig(
    entryData as Record<string, unknown>,
    {},
    mapping,
    strategyContext,
  );

  await strategyContext.onNewDocument!({
    ...mappedRoot,
    "@id": rootIRI,
    "@type": `${BASE_IRI}${typeName}`,
    idAuthority: {
      authority: authorityKey,
      id: authorityEntityIRI,
    },
  });

  return { rootIRI, staged: changeSet.list().length };
}
