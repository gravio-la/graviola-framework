import { mapByConfig } from "@graviola/edb-data-mapping";
import {
  availableAuthorityMappings,
  BASE_IRI,
  createEntityIRI,
  fixtureAuthorityAccess,
  fixtureAuthorityRecords,
  PERSON_WIKIDATA_IRI,
  primaryFields,
  typeIRItoTypeName,
  wikidataMappings,
} from "@graviola/edb-import-demo-schema";
import { createStagedChangeSet } from "../createStagedChangeSet";
import { formatCreationTree } from "../formatCreationTree";
import { makeStagingStrategyContext } from "../makeStagingStrategyContext";

const propertyToIRI = (name: string) => `${BASE_IRI}${name}`;

export const runStagingDemo = async (): Promise<void> => {
  const changeSet = createStagedChangeSet({ propertyToIRI });
  const rootIRI = createEntityIRI(`${BASE_IRI}Person`);

  const strategyContext = makeStagingStrategyContext({
    changeSet,
    mappingId: "wikidata/Person",
    sourceRef: PERSON_WIKIDATA_IRI,
    rootIRI,
    createEntityIRI,
    typeIRItoTypeName,
    primaryFields,
    normDataMappings: availableAuthorityMappings,
    authorityAccess: fixtureAuthorityAccess,
  });

  const personFixture = fixtureAuthorityRecords[PERSON_WIKIDATA_IRI];
  const mappedPerson = await mapByConfig(
    personFixture as Record<string, unknown>,
    {},
    wikidataMappings.Person,
    strategyContext,
  );

  await strategyContext.onNewDocument!({
    ...mappedPerson,
    "@id": rootIRI,
    "@type": `${BASE_IRI}Person`,
    idAuthority: {
      authority: "http://www.wikidata.org",
      id: PERSON_WIKIDATA_IRI,
    },
  });

  formatCreationTree(changeSet, {
    heading: `Staged change set ${changeSet.changeSetIRI} (offline fixtures):\n`,
    typeIRItoTypeName,
    primaryFields,
  });
};
