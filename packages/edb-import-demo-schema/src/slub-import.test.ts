import { describe, expect, test } from "bun:test";
import { makeDefaultMappingStrategyContext } from "@graviola/data-mapping-hooks";
import { mapByConfig } from "@graviola/edb-data-mapping";
import { availableAuthorityMappings } from "./mappings/availableAuthorityMappings";
import { slubPersonMapping } from "./mappings/slubLodMappings";
import { primaryFields } from "./primaryFields";
import { BASE_IRI } from "./schema";
import { typeIRItoTypeName } from "./typeIRItoTypeName";
import { fixtureAuthorityAccess } from "./fixtureAuthorityAccess";
import {
  createEntityIRI,
  createStubDatastore,
  type RecordedDocument,
} from "./demo/stubDatastore";
import { fixtureAuthorityRecords, PERSON_SLUB_IRI } from "./fixtures";

describe("SLUB LOD person mapping (offline)", () => {
  test("maps Kant fixture with birthplace and expected scalar fields", async () => {
    const { store, createdDocuments } = createStubDatastore();
    const kantFixture = fixtureAuthorityRecords[PERSON_SLUB_IRI];

    const baseContext = makeDefaultMappingStrategyContext(
      store,
      createEntityIRI,
      typeIRItoTypeName,
      primaryFields,
      availableAuthorityMappings,
      fixtureAuthorityAccess,
      true,
    );

    const strategyContext = {
      ...baseContext,
      onNewDocument: async (document: RecordedDocument) => {
        const stored = { ...document };
        createdDocuments.push(stored);
        return {
          "@id": stored["@id"],
          "@type": stored["@type"],
        };
      },
    };

    const mappedPerson = await mapByConfig(
      kantFixture as Record<string, unknown>,
      {},
      slubPersonMapping,
      strategyContext,
    );

    const rootPerson: RecordedDocument = {
      ...mappedPerson,
      "@id": createEntityIRI(`${BASE_IRI}Person`),
      "@type": `${BASE_IRI}Person`,
    };

    await strategyContext.onNewDocument!(rootPerson);

    const person = createdDocuments.find(
      (doc) => typeIRItoTypeName(doc["@type"]) === "Person",
    );
    expect(person?.name).toBe("Kant, Immanuel");
    expect(person?.birthDate).toBe(17240422);
    expect(person?.personDeceased).toBe(true);
    expect(person?.birthPlace).toBeDefined();

    const birthPlace = createdDocuments.find(
      (doc) => typeIRItoTypeName(doc["@type"]) === "Place",
    );
    expect(birthPlace).toBeDefined();
    expect(birthPlace?.title).toBe("Königsberg");
  });
});
