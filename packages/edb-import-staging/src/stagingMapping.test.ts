import { describe, expect, test } from "bun:test";
import { mapByConfig } from "@graviola/edb-data-mapping";
import { DataFactory } from "n3";
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
import { createStagedChangeSet } from "./createStagedChangeSet";
import { makeStagingStrategyContext } from "./makeStagingStrategyContext";

const { namedNode } = DataFactory;
const propertyToIRI = (name: string) => `${BASE_IRI}${name}`;

const runGoetheStagingMapping = async (options?: {
  prestageFrankfurt?: { entityIRI: string };
}) => {
  const changeSet = createStagedChangeSet({ propertyToIRI });

  if (options?.prestageFrankfurt) {
    await changeSet.stage({
      entityIRI: options.prestageFrankfurt.entityIRI,
      typeIRI: `${BASE_IRI}Place`,
      document: {
        "@id": options.prestageFrankfurt.entityIRI,
        "@type": `${BASE_IRI}Place`,
        title: "Frankfurt am Main",
        idAuthority: {
          authority: "http://www.wikidata.org",
          id: "http://www.wikidata.org/entity/Q1794",
        },
      },
      provenance: {
        method: "manual",
        timestamp: new Date().toISOString(),
      },
      trace: { mappingPath: [], decision: "created" },
    });
  }

  const rootIRI = createEntityIRI(`${BASE_IRI}Person`);
  const strategyContext = makeStagingStrategyContext({
    changeSet,
    mainStore: {
      findDocumentsByAuthorityIRI: async () => [],
      searchByLabel: async () => [],
    },
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

  const rootPerson = {
    ...mappedPerson,
    "@id": rootIRI,
    "@type": `${BASE_IRI}Person`,
    idAuthority: {
      authority: "http://www.wikidata.org",
      id: PERSON_WIKIDATA_IRI,
    },
  };

  await strategyContext.onNewDocument!(rootPerson);

  return { changeSet, rootIRI, rootPerson };
};

describe("staging mapping (offline Goethe fixture)", () => {
  test("maps into change set without touching main store", async () => {
    const { changeSet, rootIRI } = await runGoetheStagingMapping();
    const entities = changeSet.list();
    const typeNames = entities.map((e) => typeIRItoTypeName(e.typeIRI));

    expect(entities.length).toBeGreaterThanOrEqual(6);
    expect(typeNames).toContain("Person");
    expect(typeNames).toContain("Place");
    expect(
      typeNames.filter((t) => t === "Location").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      typeNames.filter((t) => t === "Occupation").length,
    ).toBeGreaterThanOrEqual(1);

    const person = entities.find(
      (e) => typeIRItoTypeName(e.typeIRI) === "Person",
    );
    expect(person?.document.name).toBe("Johann Wolfgang von Goethe");
    expect(person?.parentIRI).toBeUndefined();
    expect(person?.provenance.method).toBe("mapping");
    expect(person?.provenance.mappingId).toBe("wikidata/Person");
    expect(person?.trace.mappingPath).toEqual([]);

    for (const entity of entities) {
      expect(entity.provenance.method).toBe("mapping");
      expect(entity.trace.mappingPath.length).toBeGreaterThanOrEqual(0);
    }

    const child = entities.find((e) => e.parentIRI === rootIRI);
    expect(child).toBeDefined();
    expect(child?.depth ?? 0).toBeGreaterThanOrEqual(1);

    const frankfurt = entities.find(
      (e) =>
        typeIRItoTypeName(e.typeIRI) === "Place" &&
        e.document.title === "Frankfurt am Main",
    );
    const darmstadt = entities.find(
      (e) =>
        typeIRItoTypeName(e.typeIRI) === "Location" &&
        e.document.title === "Regierungsbezirk Darmstadt",
    );
    const hessen = entities.find(
      (e) =>
        typeIRItoTypeName(e.typeIRI) === "Location" &&
        e.document.title === "Hessen",
    );
    const deutschland = entities.find(
      (e) =>
        typeIRItoTypeName(e.typeIRI) === "Location" &&
        e.document.title === "Deutschland",
    );
    const occupation = entities.find(
      (e) => typeIRItoTypeName(e.typeIRI) === "Occupation",
    );

    expect(frankfurt?.parentIRI).toBe(rootIRI);
    expect(darmstadt?.parentIRI).toBe(frankfurt?.entityIRI);
    expect(hessen?.parentIRI).toBe(darmstadt?.entityIRI);
    expect(deutschland?.parentIRI).toBe(hessen?.entityIRI);
    expect(occupation?.parentIRI).toBe(rootIRI);
    expect(
      changeSet
        .childrenOf(rootIRI)
        .map((e) => e.entityIRI)
        .sort(),
    ).toEqual(
      [frankfurt?.entityIRI, occupation?.entityIRI].filter(Boolean).sort(),
    );

    const nameQuads = changeSet.dataset.getQuads(
      namedNode(rootIRI),
      namedNode(`${BASE_IRI}name`),
      null,
      null,
    );
    expect(nameQuads.length).toBeGreaterThanOrEqual(1);
    expect(nameQuads[0]?.object.value).toBe("Johann Wolfgang von Goethe");
  });

  test("reuses pre-staged Place matched by authority IRI", async () => {
    const frankfurtIRI = createEntityIRI(`${BASE_IRI}Place`);
    const { changeSet, rootPerson } = await runGoetheStagingMapping({
      prestageFrankfurt: { entityIRI: frankfurtIRI },
    });

    const places = changeSet
      .list()
      .filter((e) => typeIRItoTypeName(e.typeIRI) === "Place");
    expect(places).toHaveLength(1);
    expect(places[0]?.entityIRI).toBe(frankfurtIRI);

    const birthPlaceValue = rootPerson.birthPlace as
      | { ["@id"]?: string }
      | Array<{ ["@id"]?: string }>
      | undefined;
    const birthPlaceRef = Array.isArray(birthPlaceValue)
      ? birthPlaceValue[0]
      : birthPlaceValue;
    expect(birthPlaceRef?.["@id"]).toBe(frankfurtIRI);

    expect(
      changeSet
        .list()
        .some(
          (e) =>
            e.trace.decision === "matched-existing" &&
            e.trace.probedAgainst?.includes("staged"),
        ),
    ).toBe(true);
  });
});
