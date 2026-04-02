/**
 * Prisma ORM adapter.
 *
 * Activated by environment variables:
 *   SQLITE_URL    — e.g. "file:./test.db"  (default, no Docker required)
 *   POSTGRES_URL  — e.g. "postgresql://test:test@localhost:5432/graviola_test"
 *   MARIADB_URL   — e.g. "mysql://test:test@localhost:3306/graviola_test"
 *   MONGODB_URL   — not usable with Prisma 7 (MongoDB requires Prisma 6.x per Prisma docs); adapter
 *                   throws until a supported stack is wired — see datastore-tests README.
 *
 * On each `setup()`, `scripts/setupPrismaCore` regenerates schema + client for **this**
 * adapter’s `databaseUrl` (sqlite vs mysql, …). No global pre-step runs for non-Prisma adapters.
 *
 * Prisma 7+ requires a driver `adapter` (or Accelerate URL) — see `createPrismaClientForUrl`.
 * SQLite uses `@synapsenwerkstatt/prisma-bun-sqlite-adapter` (Bun sqlite); avoid better-sqlite3 (unsupported in Bun).
 * The Prisma client is loaded via dynamic import so missing `@prisma/client` fails with a clear error.
 *
 * Note: Not all operations are supported by Prisma:
 *   - countDocuments: not directly available (workaround possible, marked false for now)
 *   - findDocumentsByLabel: not implemented in prisma-db-impl
 *   - getClasses: not applicable to relational stores
 *   - importDocuments: supported via loadDocument loop
 *   - iterables: not implemented
 */
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { initPrismaStore } from "@graviola/prisma-db-impl";
import { extendSchemaShortcut } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

import {
  rawTestSchema,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  BASE_IRI,
  primaryFields,
} from "../schema/testSchema";
import type { DatastoreAdapter } from "../types";
import {
  invalidateGeneratedPrismaClientCache,
  runPrismaSetupForUrl,
} from "../../scripts/setupPrismaCore";

/**
 * Build a Prisma 7+ client using the correct driver adapter for `databaseUrl`.
 * (`new PrismaClient()` without options is invalid in v7.)
 */
async function createPrismaClientForUrl(databaseUrl: string): Promise<any> {
  invalidateGeneratedPrismaClientCache();
  let PrismaClient: any;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch (cause) {
    throw new Error(
      "@prisma/client could not be loaded after prisma generate (see setupPrismaCore).",
      { cause },
    );
  }

  const u = databaseUrl.trim();

  if (u.startsWith("file:") || u.startsWith("sqlite:")) {
    const { PrismaBunSQLite } =
      await import("@synapsenwerkstatt/prisma-bun-sqlite-adapter");
    const adapter = new PrismaBunSQLite({ url: u });
    return new PrismaClient({ adapter });
  }

  if (u.startsWith("postgresql:") || u.startsWith("postgres:")) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const adapter = new PrismaPg(u);
    return new PrismaClient({ adapter });
  }

  if (u.startsWith("mysql:") || u.startsWith("mariadb:")) {
    const { PrismaMariaDb } = await import("@prisma/adapter-mariadb");
    const adapter = new PrismaMariaDb(u);
    return new PrismaClient({ adapter });
  }

  if (u.startsWith("mongodb:")) {
    throw new Error(
      "Prisma MongoDB: Prisma ORM 7 does not support MongoDB yet (use Prisma 6.x for MongoDB per Prisma docs). " +
        "datastore-tests has not wired a separate Prisma 6 Mongo path.",
    );
  }

  throw new Error(
    `Unsupported DATABASE_URL for Prisma 7 (expected file:/postgres:/mysql:…): ${u.slice(0, 64)}`,
  );
}

/**
 * Clear all records in dependency order (children before parents) to
 * avoid FK constraint violations.
 */
async function clearPrismaData(prisma: any): Promise<void> {
  // Item references Category and has M2M with Tag — delete first
  try {
    await prisma.item.deleteMany();
  } catch {
    /* model may not exist for this schema */
  }
  try {
    await prisma.tag.deleteMany();
  } catch {
    /* model may not exist */
  }
  try {
    await prisma.category.deleteMany();
  } catch {
    /* model may not exist */
  }
}

export function createPrismaAdapter(
  name: string,
  databaseUrl: string,
): DatastoreAdapter {
  let prismaClient: any = null;

  // Extend schema to add `id` and `type` fields, matching the generated Prisma schema
  const extendedSchema = extendSchemaShortcut(
    rawTestSchema as unknown as JSONSchema7,
    "type",
    "id",
  );

  return {
    name,

    capabilities: {
      crud: true,
      listDocuments: true,
      findDocuments: true,
      countDocuments: false,
      findDocumentsByLabel: false,
      findDocumentsByAuthorityIRI: false,
      findDocumentsAsFlatResultSet: true,
      getClasses: false,
      importDocuments: true,
      iterables: false,
      filterTyped: true,
      findEntityByTypeName: false,
    },

    setup: async (): Promise<AbstractDatastore> => {
      process.env.DATABASE_URL = databaseUrl;
      // Regenerate schema + client for this URL’s provider (multiple Prisma adapters per run).
      runPrismaSetupForUrl(databaseUrl);

      prismaClient = await createPrismaClientForUrl(databaseUrl);

      await prismaClient.$connect();

      return initPrismaStore(prismaClient, extendedSchema, primaryFields, {
        jsonldContext: { "@vocab": BASE_IRI },
        defaultPrefix: BASE_IRI,
        typeNameToTypeIRI,
        typeIRItoTypeName,
      });
    },

    clearAll: async (_store: AbstractDatastore) => {
      await clearPrismaData(prismaClient);
    },

    teardown: async () => {
      if (prismaClient) {
        await prismaClient.$disconnect();
        prismaClient = null;
      }
    },
  };
}
