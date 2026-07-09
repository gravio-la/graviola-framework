import {
  extendSchemaShortcut,
  schemaFingerprintSync,
} from "@graviola/json-schema-utils";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { JSONSchema7 } from "json-schema";

import { rawTestSchema } from "./testSchema";

/** SPARQL-oriented schema with `@id` / `@type` on each definition (CBD boundaries). */
export const sparqlMetaTestSchema = extendSchemaShortcut(
  rawTestSchema as JSONSchema7,
  "@type",
  "@id",
);

/** Prisma-oriented schema with `id` / `type` on each definition. */
export const prismaMetaDomainSchema = extendSchemaShortcut(
  rawTestSchema as JSONSchema7,
  "type",
  "id",
);

export const sparqlMetaStampingConfig: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: schemaFingerprintSync(sparqlMetaTestSchema),
};

export const prismaMetaStampingConfig: MetaStampingConfig = {
  schemaVersion: "1.0.0",
  schemaFingerprint: schemaFingerprintSync(prismaMetaDomainSchema),
};
