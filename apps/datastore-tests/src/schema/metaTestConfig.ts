import {
  extendSchemaShortcut,
  JSONLD_SCHEMA_IDENTITY,
  PRISMA_SCHEMA_IDENTITY,
  schemaFingerprintSync,
} from "@graviola/json-schema-utils";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { JSONSchema7 } from "json-schema";

import { rawTestSchema } from "./testSchema";

/** SPARQL-oriented schema with `@id` / `@type` on each definition (CBD boundaries). */
export const sparqlMetaTestSchema = extendSchemaShortcut(
  rawTestSchema as JSONSchema7,
  JSONLD_SCHEMA_IDENTITY.typeKey,
  JSONLD_SCHEMA_IDENTITY.idKey,
);

/** Prisma-oriented schema with `id` / `type` on each definition. */
export const prismaMetaDomainSchema = extendSchemaShortcut(
  rawTestSchema as JSONSchema7,
  PRISMA_SCHEMA_IDENTITY.typeKey,
  PRISMA_SCHEMA_IDENTITY.idKey,
);

const sparqlFingerprint = schemaFingerprintSync(sparqlMetaTestSchema);
const prismaFingerprint = schemaFingerprintSync(prismaMetaDomainSchema);

export const sparqlMetaStampingConfig: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: sparqlFingerprint,
  lifecycleTimestamps: "application",
};

export const prismaMetaStampingConfig: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: prismaFingerprint,
  lifecycleTimestamps: "database-native",
};

export const metaStampingLifecycleOff = (
  fingerprint: string,
): MetaStampingConfig => ({
  schemaVersion: "1.0.0",
  schemaFingerprint: fingerprint,
  lifecycleTimestamps: false,
});

export const sparqlMetaStampingLifecycleOff =
  metaStampingLifecycleOff(sparqlFingerprint);

export const prismaMetaStampingLifecycleOff =
  metaStampingLifecycleOff(prismaFingerprint);

export const prismaMetaStampingApplication: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: prismaFingerprint,
  lifecycleTimestamps: "application",
};

/** SPARQL config requesting database-native — descriptor should report application. */
export const sparqlMetaStampingDatabaseNativeConfig: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: sparqlFingerprint,
  lifecycleTimestamps: "database-native",
};
