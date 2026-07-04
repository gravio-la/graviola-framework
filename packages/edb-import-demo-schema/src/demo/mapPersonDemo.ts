import { makeDefaultMappingStrategyContext } from "@graviola/data-mapping-hooks";
import { mapByConfig } from "@graviola/edb-data-mapping";
import { availableAuthorityMappings } from "../mappings/availableAuthorityMappings";
import { wikidataMappings } from "../mappings/wikidataMappings";
import { primaryFields } from "../primaryFields";
import { BASE_IRI } from "../schema";
import { typeIRItoTypeName } from "../typeIRItoTypeName";
import { fixtureAuthorityAccess } from "../fixtureAuthorityAccess";
import { fixtureAuthorityRecords, PERSON_WIKIDATA_IRI } from "../fixtures";
import {
  createEntityIRI,
  createStubDatastore,
  type RecordedDocument,
} from "./stubDatastore";

const labelFor = (doc: RecordedDocument): string => {
  const typeName = typeIRItoTypeName(doc["@type"]);
  const field = primaryFields[typeName]?.label ?? "title";
  const value = doc[field];
  if (typeof value === "string" && value.length > 0) return value;
  if (doc.idAuthority && typeof doc.idAuthority === "object") {
    const id = (doc.idAuthority as { id?: string }).id;
    if (id) return id;
  }
  return doc["@id"];
};

export const printCreationTree = (documents: RecordedDocument[]): void => {
  const byId = new Map(documents.map((doc) => [doc["@id"], doc]));
  const referenced = new Set<string>();

  for (const doc of documents) {
    const walk = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      const maybeRef = value as { "@id"?: string };
      if (maybeRef["@id"]) referenced.add(maybeRef["@id"]);
      Object.values(value).forEach(walk);
    };
    Object.values(doc).forEach(walk);
  }

  const roots = documents.filter((doc) => !referenced.has(doc["@id"]));
  const root = roots[0] ?? documents[0];

  const printNode = (doc: RecordedDocument, depth: number) => {
    const typeName = typeIRItoTypeName(doc["@type"]);
    const indent = "  ".repeat(depth);
    console.log(`${indent}- ${typeName}: ${labelFor(doc)} (${doc["@id"]})`);

    for (const value of Object.values(doc)) {
      if (!value || typeof value !== "object") continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object" && "@id" in item) {
            const child = byId.get((item as { "@id": string })["@id"]);
            if (child) printNode(child, depth + 1);
          }
        }
      } else if ("@id" in value) {
        const child = byId.get((value as { "@id": string })["@id"]);
        if (child) printNode(child, depth + 1);
      }
    }
  };

  console.log("Entity creation tree (offline fixtures):\n");
  if (root) {
    printNode(root, 0);
  }
  console.log(`\nTotal entities created: ${documents.length}`);
};

export const runPersonMappingDemo = async (): Promise<RecordedDocument[]> => {
  const { store, createdDocuments } = createStubDatastore();
  const personFixture = fixtureAuthorityRecords[PERSON_WIKIDATA_IRI];

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
    personFixture as Record<string, unknown>,
    {},
    wikidataMappings.Person,
    strategyContext,
  );

  const rootPerson: RecordedDocument = {
    ...mappedPerson,
    "@id": createEntityIRI(`${BASE_IRI}Person`),
    "@type": `${BASE_IRI}Person`,
    idAuthority: {
      authority: "http://www.wikidata.org",
      id: PERSON_WIKIDATA_IRI,
    },
  };

  await strategyContext.onNewDocument!(rootPerson);

  return createdDocuments;
};
