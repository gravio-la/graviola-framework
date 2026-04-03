/**
 * Prisma ORM adapter.
 *
 * Activated by environment variables:
 *   SQLITE_URL    — e.g. "file:./test.db"  (default, no Docker required)
 *   POSTGRES_URL  — e.g. "postgresql://test:test@localhost:5432/graviola_test"
 *   MARIADB_URL   — e.g. "mysql://test:test@localhost:3306/graviola_test"
 *   MONGODB_URL   — e.g. mongodb://…/graviola_test?authSource=admin&directConnection=true&replicaSet=rs0 (single-node RS in Docker)
 *
 * On each `setup()`, `scripts/setupPrismaCore` regenerates schema + client for **this**
 * adapter’s `databaseUrl` (sqlite vs mysql, …). No global pre-step runs for non-Prisma adapters.
 *
 * Prisma client is loaded via dynamic import so missing `@prisma/client` fails with a clear error.
 *
 * **Prisma 6:** `new PrismaClient({ datasources: { db: { url } } })`. Use `nix develop .#prisma6` so
 * engine paths match the catalog client (see app README).
 *
 * **Prisma 7:** driver adapters only (no datasource URL on the client). SQLite uses
 * `@synapsenwerkstatt/prisma-bun-sqlite-adapter`; PostgreSQL `@prisma/adapter-pg`; MySQL/MariaDB
 * `@prisma/adapter-mariadb`. MongoDB is not supported on Prisma ORM 7 — use Prisma 6 for Mongo.
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
  databaseUrlToProvider,
  getInstalledPrismaMajorVersion,
  invalidateGeneratedPrismaClientCache,
  runPrismaSetupForUrl,
} from "../../scripts/setupPrismaCore";

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
  const provider = databaseUrlToProvider(u);
  const major = getInstalledPrismaMajorVersion();

  if (major === 6) {
    return new PrismaClient({
      datasources: {
        db: {
          url: u,
        },
      },
    });
  }

  if (provider === "mongodb") {
    throw new Error(
      "Prisma MongoDB: Prisma ORM 7 does not support MongoDB yet. Use Prisma 6.x for MongoDB " +
        "(e.g. `nix develop .#prisma6` and catalog prisma 6.x). datastore-tests does not wire a Prisma 7 Mongo path.",
    );
  }

  switch (provider) {
    case "sqlite": {
      const { PrismaBunSQLite } =
        await import("@synapsenwerkstatt/prisma-bun-sqlite-adapter");
      const adapter = new PrismaBunSQLite({ url: u });
      return new PrismaClient({ adapter });
    }
    case "postgresql": {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const adapter = new PrismaPg({ connectionString: u });
      return new PrismaClient({ adapter });
    }
    case "mysql": {
      const { PrismaMariaDb } = await import("@prisma/adapter-mariadb");
      const adapter = new PrismaMariaDb(u);
      return new PrismaClient({ adapter });
    }
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported Prisma 7 datasource: ${_exhaustive}`);
    }
  }
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
        datasourceProvider: databaseUrlToProvider(databaseUrl),
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
