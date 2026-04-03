import {
  PrimaryField,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import { extendSchemaShortcut } from "@graviola/json-schema-utils";
import { initPrismaStore } from "@graviola/prisma-db-impl";
import { PrismaClient } from "@prisma/client";
import { JSONSchema7 } from "json-schema";
import schema from "./schema.json";

const baseIRI = "http://example.com/";
const config = {
  defaultJsonldContext: {
    "@vocab": baseIRI,
  },
  defaultPrefix: baseIRI,
};

const typeNameToTypeIRI = (typeName: string) => `${baseIRI}${typeName}`;

const typeIRItoTypeName = (iri: string) => {
  return iri?.substring(baseIRI.length, iri.length);
};

const primaryFields: PrimaryFieldDeclaration = {
  Item: {
    label: "name",
    description: "description",
  },
  Order: {
    label: "orderNumber",
  },
  Category: {
    label: "title",
    description: "description",
  },
};

const rootSchema = extendSchemaShortcut(schema as JSONSchema7, "type", "id");

const prisma = new PrismaClient();
export { prisma };

// Create two different data stores - one with nested element creation enabled and one without
export const dataStore = initPrismaStore(prisma, rootSchema, primaryFields, {
  jsonldContext: config.defaultJsonldContext,
  defaultPrefix: config.defaultPrefix,
  typeIRItoTypeName: typeIRItoTypeName,
  typeNameToTypeIRI: typeNameToTypeIRI,
  datasourceProvider: "postgresql",
});

export const dataStoreWithNestedElements = initPrismaStore(
  prisma,
  rootSchema,
  primaryFields,
  {
    jsonldContext: config.defaultJsonldContext,
    defaultPrefix: config.defaultPrefix,
    typeIRItoTypeName: typeIRItoTypeName,
    typeNameToTypeIRI: typeNameToTypeIRI,
    datasourceProvider: "postgresql",
    allowUnknownNestedElementCreation: true,
    isAllowedNestedElement: (element: any) =>
      element["@type"] === "http://example.com/Category",
  },
);

//load something into the store

const saveAndLoad = async () => {
  const e = (id: string) => typeNameToTypeIRI(id);
  const item1IRI = e("Item1");
  await dataStore
    .upsertDocument("Item", item1IRI, {
      id: item1IRI,
      name: "Item 1",
      description: "Description of Item 1",
      amount: 10,
    })
    .then(() => {
      console.log("Item 1 upserted");
    })
    .catch((err) => {
      console.error("Error upserting Item 1:", err);
    });

  await dataStore
    .listDocuments("Item", 10)
    .then((items) => {
      console.log("Items:", items);
    })
    .catch((err) => {
      console.error("Error listing items:", err);
    });
};
