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
 * Note: The Prisma Store only advertises wired capabilities (`@graviola/prisma-db-impl`).
 * Optional suites (label search, streams, typed graph filters, …) are skipped when the runtime
 * `capabilities` descriptor does not expose the corresponding flags.
 */
import { initPrismaDatastorePair } from "@graviola/prisma-db-impl";
import type { PersistenceManifest } from "@graviola/json-schema-prisma-utils";
import type { JSONSchema7 } from "json-schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  rawTestSchema,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  BASE_IRI,
  primaryFields,
} from "../schema/testSchema";
import {
  prismaMetaStampingApplication,
  prismaMetaStampingConfig,
  prismaMetaStampingLifecycleOff,
} from "../schema/metaTestConfig";
import { prismaStatementMetaConfig } from "../schema/statementTestConfig";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type {
  DatastoreAdapter,
  DatastoreContractStore,
  DatastoreContractStoreWithStatements,
} from "../types";
import {
  databaseUrlToProvider,
  getInstalledPrismaMajorVersion,
  invalidateGeneratedPrismaClientCache,
  jsonLdSchemaToPrismaIdentity,
  runPrismaSetupForUrl,
} from "../../scripts/setupPrismaCore";

function loadPersistenceManifest(): PersistenceManifest | undefined {
  const path = join(import.meta.dir, "../../prisma/persistence-manifest.json");
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf-8")) as PersistenceManifest;
}

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
  // Child tables first (multi-value lists), then entities
  for (const model of [
    "item_media_copyright_notes",
    "item_media",
    "item_photos",
    "item_yearCodes",
    "Item_media_copyright_notes",
    "Item_media",
    "Item_photos",
    "Item_yearCodes",
  ]) {
    try {
      await prisma[model]?.deleteMany?.();
    } catch {
      /* model may not exist */
    }
  }
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
    await prisma.graviolaStatement?.deleteMany?.();
  } catch {
    /* side table may not exist on Mongo */
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

  // Match generated Prisma models: `id` / `type` (not `@id` / `@type`).
  const extendedSchema = jsonLdSchemaToPrismaIdentity(
    rawTestSchema as unknown as JSONSchema7,
  );

  return {
    name,

    setup: async () => {
      process.env.DATABASE_URL = databaseUrl;
      // Regenerate schema + client for this URL’s provider (multiple Prisma adapters per run).
      runPrismaSetupForUrl(databaseUrl);

      prismaClient = await createPrismaClientForUrl(databaseUrl);

      await prismaClient.$connect();

      const pairOptions = {
        jsonldContext: { "@vocab": BASE_IRI },
        defaultPrefix: BASE_IRI,
        typeNameToTypeIRI,
        typeIRItoTypeName,
        datasourceProvider: databaseUrlToProvider(databaseUrl),
        persistenceManifest: loadPersistenceManifest(),
      };

      const { store } = initPrismaDatastorePair(
        prismaClient,
        extendedSchema,
        primaryFields,
        pairOptions,
      );

      const metaPair = (config: MetaStampingConfig) =>
        initPrismaDatastorePair(prismaClient, extendedSchema, primaryFields, {
          ...pairOptions,
          metaStamping: config,
        });

      const { store: metaStampingStore } = metaPair(prismaMetaStampingConfig);
      const { store: lifecycleOffStore } = metaPair(
        prismaMetaStampingLifecycleOff,
      );
      const { store: applicationStore } = metaPair(
        prismaMetaStampingApplication,
      );

      const provider = databaseUrlToProvider(databaseUrl);
      const statementVariants =
        provider === "mongodb"
          ? {}
          : {
              statementStore: initPrismaDatastorePair(
                prismaClient,
                extendedSchema,
                primaryFields,
                {
                  ...pairOptions,
                  statementMeta: prismaStatementMetaConfig,
                },
              ).store as DatastoreContractStoreWithStatements,
              statementMetaStampingStore: initPrismaDatastorePair(
                prismaClient,
                extendedSchema,
                primaryFields,
                {
                  ...pairOptions,
                  statementMeta: prismaStatementMetaConfig,
                  metaStamping: prismaMetaStampingConfig,
                },
              ).store as DatastoreContractStoreWithStatements,
            };

      return {
        store: store as DatastoreContractStore,
        metaStampingStore: metaStampingStore as DatastoreContractStore,
        metaStampingStores: {
          lifecycleOff: lifecycleOffStore as DatastoreContractStore,
          application: applicationStore as DatastoreContractStore,
        },
        ...statementVariants,
      };
    },

    clearAll: async () => {
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
