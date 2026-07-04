import { createSemanticConfig } from "@graviola/semantic-json-form";
import { initPrismaDatastorePair } from "@graviola/prisma-db-impl";
import { defs, extendSchemaShortcut } from "@graviola/json-schema-utils";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  BASE_IRI,
  primaryFields,
  schema,
  typeIRItoTypeName,
} from "@graviola/edb-import-demo-schema";
import type { JSONSchema7 } from "json-schema";
import { PrismaClient } from "../generated/client/index.js";
import { createEntityIRI } from "./entityIri";

export const TYPE_NAMES = Object.keys(defs(schema));

const DEFAULT_DATABASE_URL =
  "postgresql://graviola:graviola@localhost:5433/import_api";

const semanticConfig = createSemanticConfig({
  baseIRI: BASE_IRI,
  override: {
    typeIRIToTypeName: typeIRItoTypeName,
    propertyIRIToPropertyName: typeIRItoTypeName,
    createEntityIRI: (typeName: string) => createEntityIRI(typeName),
    queryBuildOptions: {
      ...createSemanticConfig({ baseIRI: BASE_IRI }).queryBuildOptions,
      primaryFields,
      typeIRItoTypeName,
    },
  },
});

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// The Prisma models carry plain `id`/`type` columns (injected by db:setup);
// extending the schema the same way makes the generated selects include them,
// so list/load responses carry `@id`/`@type` after toJSONLD conversion.
const prismaSchema = extendSchemaShortcut(schema as JSONSchema7, "type", "id");

export function createPrismaStorePair() {
  const prisma = createPrismaClient();
  return initPrismaDatastorePair(prisma, prismaSchema, primaryFields, {
    jsonldContext: semanticConfig.jsonLDConfig.jsonldContext ?? {
      "@vocab": BASE_IRI,
    },
    defaultPrefix: semanticConfig.jsonLDConfig.defaultPrefix,
    typeNameToTypeIRI: semanticConfig.typeNameToTypeIRI,
    typeIRItoTypeName,
    datasourceProvider: "postgresql",
    debug: process.env.GRAVIOLA_DEBUG === "1",
  });
}

export { semanticConfig };
