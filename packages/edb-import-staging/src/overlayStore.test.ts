import { describe, expect, test } from "bun:test";
import {
  BASE_IRI,
  createEntityIRI,
  schema,
  typeIRItoTypeName,
} from "@graviola/edb-import-demo-schema";
import { createOverlayStore } from "./overlayStore";
import { createStagedChangeSet } from "./createStagedChangeSet";
import { makeStagingStrategyContext } from "./makeStagingStrategyContext";
import { mapByConfig } from "@graviola/edb-data-mapping";
import {
  availableAuthorityMappings,
  fixtureAuthorityAccess,
  fixtureAuthorityRecords,
  PERSON_WIKIDATA_IRI,
  primaryFields,
  wikidataMappings,
} from "@graviola/edb-import-demo-schema";

const propertyToIRI = (name: string) => `${BASE_IRI}${name}`;
const typeNameToTypeIRI = (typeName: string) => `${BASE_IRI}${typeName}`;

const overlayOptions = (
  changeSet: ReturnType<typeof createStagedChangeSet>,
) => ({
  changeSet,
  schema,
  typeIRItoTypeName,
  typeNameToTypeIRI,
  defaultPrefix: BASE_IRI,
  propertyToIRI,
});

const runGoetheStaging = async () => {
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

  return { changeSet, rootIRI };
};

describe("createOverlayStore", () => {
  test("loadOne of staged Person resolves nested birthPlace chain", async () => {
    const { changeSet, rootIRI } = await runGoetheStaging();
    const overlay = createOverlayStore(overlayOptions(changeSet));

    const person = await overlay.loadOne("Person", rootIRI);
    expect(person).not.toBeNull();
    expect(person?.name).toBe("Johann Wolfgang von Goethe");

    const birthPlace = person?.birthPlace as {
      ["@id"]?: string;
      location?: { ["@id"]?: string };
    };
    expect(birthPlace?.["@id"]).toBeDefined();
    const placeIRI = birthPlace!["@id"]!;

    const place = await overlay.loadOne("Place", placeIRI);
    expect(place?.title).toBe("Frankfurt am Main");

    const locationRef = place?.location as {
      ["@id"]?: string;
      parent?: { ["@id"]?: string };
    };
    expect(locationRef?.["@id"]).toBeDefined();

    const darmstadt = await overlay.loadOne("Location", locationRef!["@id"]!);
    expect(darmstadt?.title).toBe("Regierungsbezirk Darmstadt");

    const hessenRef = darmstadt?.parent as { ["@id"]?: string };
    const hessen = await overlay.loadOne("Location", hessenRef!["@id"]!);
    expect(hessen?.title).toBe("Hessen");

    const deutschlandRef = hessen?.parent as { ["@id"]?: string };
    const deutschland = await overlay.loadOne(
      "Location",
      deutschlandRef!["@id"]!,
    );
    expect(deutschland?.title).toBe("Deutschland");
  });

  test("loadOne hydrates from main store lazily and caches", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const existingIRI = `${BASE_IRI}existing-place`;
    const loadOneCalls: string[] = [];

    const overlay = createOverlayStore({
      ...overlayOptions(changeSet),
      mainStore: {
        loadOne: async (_typeName, iri) => {
          loadOneCalls.push(iri);
          return {
            "@id": existingIRI,
            "@type": `${BASE_IRI}Place`,
            title: "Cached Place",
          };
        },
      },
    });

    const first = await overlay.loadOne("Place", existingIRI);
    expect(first?.title).toBe("Cached Place");
    expect(loadOneCalls).toEqual([existingIRI]);

    const second = await overlay.loadOne("Place", existingIRI);
    expect(second?.title).toBe("Cached Place");
    expect(loadOneCalls).toEqual([existingIRI]);
  });

  test("statusOf returns new, augmented, and existing", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const stagedOnlyIRI = createEntityIRI(`${BASE_IRI}Place`);
    const sharedIRI = createEntityIRI(`${BASE_IRI}Person`);
    const mainOnlyIRI = `${BASE_IRI}main-only`;

    await changeSet.stage({
      entityIRI: stagedOnlyIRI,
      typeIRI: `${BASE_IRI}Place`,
      document: {
        "@id": stagedOnlyIRI,
        "@type": `${BASE_IRI}Place`,
        title: "New only",
      },
      provenance: { method: "manual", timestamp: new Date().toISOString() },
      trace: { mappingPath: [], decision: "created" },
    });

    await changeSet.stage({
      entityIRI: sharedIRI,
      typeIRI: `${BASE_IRI}Person`,
      document: {
        "@id": sharedIRI,
        "@type": `${BASE_IRI}Person`,
        name: "Staged side",
      },
      provenance: { method: "manual", timestamp: new Date().toISOString() },
      trace: { mappingPath: [], decision: "created" },
    });

    const overlay = createOverlayStore({
      ...overlayOptions(changeSet),
      mainStore: {
        loadOne: async (typeName, iri) => {
          if (iri === sharedIRI) {
            return {
              "@id": sharedIRI,
              "@type": `${BASE_IRI}Person`,
              name: "Main side",
            };
          }
          if (iri === mainOnlyIRI) {
            return {
              "@id": mainOnlyIRI,
              "@type": `${BASE_IRI}Place`,
              title: "Main only",
            };
          }
          return null;
        },
        listAll: async () => [
          {
            "@id": mainOnlyIRI,
            "@type": `${BASE_IRI}Place`,
            title: "Main only",
          },
          {
            "@id": sharedIRI,
            "@type": `${BASE_IRI}Person`,
            name: "Main side",
          },
        ],
      },
    });

    expect(overlay.statusOf(stagedOnlyIRI)).toBe("new");
    await overlay.list("Place");
    expect(overlay.statusOf(mainOnlyIRI)).toBe("existing");
    await overlay.list("Person");
    expect(overlay.statusOf(sharedIRI)).toBe("augmented");
  });

  test("list merges staged and main results deduped by IRI", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const stagedIRI = createEntityIRI(`${BASE_IRI}Person`);
    const mainOnlyIRI = `${BASE_IRI}other-person`;

    await changeSet.stage({
      entityIRI: stagedIRI,
      typeIRI: `${BASE_IRI}Person`,
      document: {
        "@id": stagedIRI,
        "@type": `${BASE_IRI}Person`,
        name: "Staged Person",
      },
      provenance: { method: "manual", timestamp: new Date().toISOString() },
      trace: { mappingPath: [], decision: "created" },
    });

    const overlay = createOverlayStore({
      ...overlayOptions(changeSet),
      mainStore: {
        loadOne: async () => null,
        listAll: async () => [
          {
            "@id": stagedIRI,
            "@type": `${BASE_IRI}Person`,
            name: "Main copy",
          },
          {
            "@id": mainOnlyIRI,
            "@type": `${BASE_IRI}Person`,
            name: "Main only Person",
          },
        ],
      },
    });

    const items = await overlay.list("Person");
    expect(items).toHaveLength(2);
    const byId = new Map(
      items.map((item) => [item.document["@id"], item.status]),
    );
    expect(byId.get(stagedIRI)).toBe("augmented");
    expect(byId.get(mainOnlyIRI)).toBe("existing");
  });
});
