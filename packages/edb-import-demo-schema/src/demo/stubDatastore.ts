import type { CrudDatastoreStore } from "@graviola/edb-state-hooks";

export type RecordedDocument = {
  "@id": string;
  "@type": string;
  [key: string]: unknown;
};

export type StubDatastore = {
  store: CrudDatastoreStore;
  createdDocuments: RecordedDocument[];
  reset: () => void;
};

let iriCounter = 0;

export const createStubDatastore = (): StubDatastore => {
  const createdDocuments: RecordedDocument[] = [];

  const store = {
    findDocumentsByAuthorityIRI: async () => [],
    searchByLabel: async () => [],
    upsertDocument: async (
      _typeName: string,
      _entityIRI: string,
      document: RecordedDocument,
    ) => {
      const existing = createdDocuments.findIndex(
        (doc) => doc["@id"] === document["@id"],
      );
      if (existing >= 0) {
        createdDocuments[existing] = document;
      } else {
        createdDocuments.push(document);
      }
      return document;
    },
  } as unknown as CrudDatastoreStore;

  return {
    store,
    createdDocuments,
    reset: () => {
      createdDocuments.length = 0;
      iriCounter = 0;
    },
  };
};

export const createEntityIRI = (typeIRI: string): string => {
  iriCounter += 1;
  return `http://ontologies.slub-dresden.de/exhibition/entity/demo-${iriCounter}-${typeIRI.split("#").pop() ?? "Entity"}`;
};
