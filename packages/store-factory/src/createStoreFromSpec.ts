import { createOxigraphStore } from "./createOxigraphStore.js";
import { createPrismaStore } from "./createPrismaStore.js";
import { createSparqlStore } from "./createSparqlStore.js";
import type {
  CreateStoreFromSpecOptions,
  CreateStoreResult,
  StoreBackendSpec,
} from "./types.js";

/**
 * Build a capability-composed Store from a declarative backend spec.
 *
 * Backend packages (`oxigraph`, `@graviola/sparql-db-impl`, `@graviola/prisma-db-impl`)
 * are loaded lazily so consumers only pay for the backend they pick.
 */
export async function createStoreFromSpec(
  opts: CreateStoreFromSpecOptions,
): Promise<CreateStoreResult> {
  switch (opts.backend.kind) {
    case "oxigraph":
      return createOxigraphStore(
        opts as CreateStoreFromSpecOptions & {
          backend: Extract<StoreBackendSpec, { kind: "oxigraph" }>;
        },
      );
    case "sparql":
      return createSparqlStore(
        opts as CreateStoreFromSpecOptions & {
          backend: Extract<StoreBackendSpec, { kind: "sparql" }>;
        },
      );
    case "prisma":
      return createPrismaStore(
        opts as CreateStoreFromSpecOptions & {
          backend: Extract<StoreBackendSpec, { kind: "prisma" }>;
        },
      );
    default: {
      const _exhaustive: never = opts.backend;
      throw new Error(`Unknown store backend: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Resolve backend from environment variables, then call {@link createStoreFromSpec}.
 *
 * - `GRAVIOLA_STORE=oxigraph|sparql|prisma` (default: `oxigraph`)
 * - `GRAVIOLA_SPARQL_URL` / `OXIGRAPH_URL` — remote SPARQL endpoint
 * - `DATABASE_URL` / `SQLITE_URL` — Prisma datasource
 * - `GRAVIOLA_TURTLE` — optional Turtle seed for oxigraph backend
 */
export async function createStoreFromEnv(
  opts: Omit<CreateStoreFromSpecOptions, "backend"> & {
    backend?: StoreBackendSpec;
  },
): Promise<CreateStoreResult> {
  if (opts.backend) {
    return createStoreFromSpec({ ...opts, backend: opts.backend });
  }

  const kind = (process.env.GRAVIOLA_STORE ?? "oxigraph").toLowerCase();

  if (kind === "prisma") {
    const datasourceUrl =
      process.env.DATABASE_URL ??
      process.env.SQLITE_URL ??
      "file:./prisma/dev.db";
    return createStoreFromSpec({
      ...opts,
      backend: {
        kind: "prisma",
        datasourceUrl,
        provider: process.env.GRAVIOLA_PRISMA_PROVIDER,
      },
    });
  }

  if (kind === "sparql") {
    const endpoint =
      process.env.GRAVIOLA_SPARQL_URL ??
      process.env.OXIGRAPH_URL ??
      process.env.FUSEKI_URL;
    if (!endpoint) {
      throw new Error(
        "GRAVIOLA_STORE=sparql requires GRAVIOLA_SPARQL_URL (or OXIGRAPH_URL / FUSEKI_URL)",
      );
    }
    return createStoreFromSpec({
      ...opts,
      backend: {
        kind: "sparql",
        endpoint,
        flavour: process.env.GRAVIOLA_SPARQL_FLAVOUR as
          | "oxigraph"
          | "default"
          | "blazegraph"
          | "allegro"
          | "jena"
          | undefined,
      },
    });
  }

  return createStoreFromSpec({
    ...opts,
    backend: {
      kind: "oxigraph",
      initialData: process.env.GRAVIOLA_TURTLE,
    },
  });
}
