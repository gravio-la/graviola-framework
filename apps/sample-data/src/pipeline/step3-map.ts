import { mapByConfig } from "@graviola/edb-data-mapping";
import type { AuthorityConfiguration } from "@graviola/edb-data-mapping";
import {
  createStagedChangeSet,
  makeStagingStrategyContext,
  type StagedChangeSet,
} from "@graviola/edb-import-staging";
import type { CachedEntityFetcher } from "./step2-entities";
import type { ProgressLogger, SampleDomain } from "./types";
import { WIKIDATA_AUTHORITY_IRI, WIKIDATA_ENTITY_PREFIX } from "./types";

export type MapStepResult = {
  changeSet: StagedChangeSet;
  typeCounts: Record<string, number>;
  tempIriCounter: number;
};

const buildNormDataMappings = (domain: SampleDomain) => ({
  [WIKIDATA_AUTHORITY_IRI]: {
    label: "Wikidata",
    sameAsTypeMap: domain.sameAsTypeMap ?? {},
    mapping: domain.mappings,
  },
});

export const runStep3Map = async (options: {
  domain: SampleDomain;
  seedIris: string[];
  entityFetcher: CachedEntityFetcher;
  progress: ProgressLogger;
}): Promise<MapStepResult> => {
  const { domain, seedIris, entityFetcher, progress } = options;
  const propertyToIRI = (name: string) => `${domain.baseIRI}${name}`;
  const typeIRItoTypeName = (iri: string) =>
    iri.startsWith(domain.baseIRI) ? iri.slice(domain.baseIRI.length) : iri;

  let tempIriCounter = 0;
  const createEntityIRI = (typeIRI: string): string => {
    tempIriCounter += 1;
    const typeName = typeIRItoTypeName(typeIRI);
    return `urn:graviola:sample-temp:${typeName}:${String(tempIriCounter).padStart(5, "0")}`;
  };

  const changeSet = createStagedChangeSet({ propertyToIRI });
  const authorityAccess: Record<string, AuthorityConfiguration> = {
    [WIKIDATA_AUTHORITY_IRI]: {
      authorityIRI: WIKIDATA_AUTHORITY_IRI,
      getEntityByIRI: entityFetcher.getEntityByIRI,
    },
  };
  const normDataMappings = buildNormDataMappings(domain);
  const mapping = domain.mappings[domain.seed.typeName];
  if (!mapping) {
    throw new Error(
      `No mapping for seed typeName "${domain.seed.typeName}" in domain "${domain.name}"`,
    );
  }

  const seedTypeIRI = `${domain.baseIRI}${domain.seed.typeName}`;
  let mapped = 0;

  for (const seedIri of seedIris) {
    const rootIRI = createEntityIRI(seedTypeIRI);
    const strategyContext = makeStagingStrategyContext({
      changeSet,
      mainStore: {
        findDocumentsByAuthorityIRI: async () => [],
        searchByLabel: async () => [],
      },
      mappingId: `wikidata/${domain.seed.typeName}`,
      sourceRef: seedIri,
      rootIRI,
      createEntityIRI,
      typeIRItoTypeName,
      primaryFields: domain.primaryFields,
      normDataMappings,
      authorityAccess,
      disableLogging: true,
    });

    const entryData = await entityFetcher.getEntityByIRI(seedIri);
    if (!entryData) {
      progress.info(`skip ${seedIri}: no entity data`);
      continue;
    }

    const mappedRoot = await mapByConfig(
      entryData as Record<string, unknown>,
      {},
      mapping,
      strategyContext,
    );

    await strategyContext.onNewDocument!({
      ...mappedRoot,
      "@id": rootIRI,
      "@type": seedTypeIRI,
      idAuthority: {
        authority: WIKIDATA_AUTHORITY_IRI,
        id: seedIri.startsWith(WIKIDATA_ENTITY_PREFIX)
          ? seedIri
          : `${WIKIDATA_ENTITY_PREFIX}${seedIri}`,
      },
    });
    mapped += 1;
  }

  const typeCounts: Record<string, number> = {};
  for (const entity of changeSet.list()) {
    const typeName = typeIRItoTypeName(entity.typeIRI);
    typeCounts[typeName] = (typeCounts[typeName] ?? 0) + 1;
  }

  const entityStats = entityFetcher.stats();
  const typeSummary = Object.entries(typeCounts)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");

  progress.step(
    2,
    3,
    "entity fetch",
    `${entityStats.cached + entityStats.fetched} records         (${entityStats.fetched} fetched, ${entityStats.cached} cached)`,
  );
  progress.step(
    3,
    3,
    "map + stage",
    `${changeSet.list().length} documents       (${typeSummary || `${mapped} seeds`})`,
  );

  return { changeSet, typeCounts, tempIriCounter };
};
