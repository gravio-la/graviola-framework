export { schema, schemaName, BASE_IRI } from "./schema";
export { makeStubSchema, schemaExpander } from "./makeStubSchema";
export { primaryFields } from "./primaryFields";
export { typeIRItoTypeName } from "./typeIRItoTypeName";

export { wikidataMappings, wikidataTypeMap } from "./mappings/wikidataMappings";
export {
  lobidMappings,
  lobidTypemap,
  sladb,
  personDeclarativeMapping,
  locationDeclarativeMapping,
  corporateBodyDeclarativeMapping,
} from "./mappings/lobidMappings";
export { availableAuthorityMappings } from "./mappings/availableAuthorityMappings";
export { authorityAccess } from "./mappings/authorityAccess";
export {
  SLUB_LOD_AUTHORITY,
  extractSlubLodSearchSecondary,
  findEntityWithinSlubLod,
  getEntityFromSlubLodByIRI,
  slubLodSearchAdapterConfig,
  slubLodTypeMap,
  slubSchemaOrgTypeMap,
  type SlubLodSearchAdapterConfig,
  type SlubLodSearchHit,
} from "./mappings/slubLodAccess";
export {
  slubLodMappings,
  slubPersonMapping,
  slubPlaceMapping,
  slubOccupationMapping,
} from "./mappings/slubLodMappings";
export { liveFirstAuthorityAccess } from "./liveAuthorityAccess";
export { fixtureAuthorityAccess } from "./fixtureAuthorityAccess";
export {
  fixtureAuthorityRecords,
  PERSON_WIKIDATA_IRI,
  PERSON_LOBID_IRI,
  PERSON_SLUB_IRI,
} from "./fixtures";

export { runPersonMappingDemo, printCreationTree } from "./demo/mapPersonDemo";
export { createStubDatastore, createEntityIRI } from "./demo/stubDatastore";
