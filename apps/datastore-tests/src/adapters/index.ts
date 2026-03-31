import type { AbstractDatastore } from "@graviola/edb-global-types";
import type { DatastoreAdapter } from "../types";
import { createOxigraphLocalAdapter } from "./oxigraphLocalAdapter";
import { createSparqlAdapter } from "./sparqlAdapter";
import { createPrismaAdapter } from "./prismaAdapter";

/**
 * Returns the list of adapters to test against, based on environment variables.
 *
 * Always-on (no env var needed):
 *   - SPARQL/Oxigraph (in-process) — uses oxigraph npm Store directly
 *
 * Opt-in via env vars:
 *   - OXIGRAPH_URL    → SPARQL/Oxigraph (Docker HTTP)
 *   - BLAZEGRAPH_URL  → SPARQL/Blazegraph (Docker HTTP)
 *   - SQLITE_URL      → Prisma/SQLite  (default: file:./prisma/test.db)
 *   - POSTGRES_URL    → Prisma/PostgreSQL
 *   - MARIADB_URL     → Prisma/MariaDB
 *   - MONGODB_URL     → Prisma/MongoDB (experimental)
 *
 * Example — run with all SPARQL backends:
 *   OXIGRAPH_URL=http://localhost:7878 BLAZEGRAPH_URL=http://localhost:9999/bigdata bun test
 *
 * Example — run with SQLite Prisma (runs pretest to generate schema):
 *   bun run pretest && SQLITE_URL=file:./prisma/test.db bun test
 */
export async function getActiveAdapters(): Promise<DatastoreAdapter[]> {
  const adapters: DatastoreAdapter[] = [];

  // ─── Always-on: local Oxigraph in-process ────────────────────────────────
  adapters.push(createOxigraphLocalAdapter());

  // ─── SPARQL HTTP endpoints ────────────────────────────────────────────────
  if (process.env.OXIGRAPH_URL) {
    adapters.push(
      createSparqlAdapter(
        "SPARQL/Oxigraph (Docker)",
        process.env.OXIGRAPH_URL,
        "oxigraph",
      ),
    );
  }

  if (process.env.BLAZEGRAPH_URL) {
    adapters.push(
      createSparqlAdapter(
        "SPARQL/Blazegraph (Docker)",
        process.env.BLAZEGRAPH_URL,
        "blazegraph",
      ),
    );
  }

  // ─── Prisma adapters ──────────────────────────────────────────────────────
  const sqliteUrl = process.env.SQLITE_URL ?? "file:./prisma/test.db";

  // SQLite is the always-on Prisma adapter (no Docker required).
  // Only include if pretest has been run (SKIP_PRISMA=1 to disable).
  if (!process.env.SKIP_PRISMA) {
    adapters.push(createPrismaAdapter("Prisma/SQLite", sqliteUrl));
  }

  if (process.env.POSTGRES_URL) {
    adapters.push(
      createPrismaAdapter("Prisma/PostgreSQL", process.env.POSTGRES_URL),
    );
  }

  if (process.env.MARIADB_URL) {
    adapters.push(
      createPrismaAdapter("Prisma/MariaDB", process.env.MARIADB_URL),
    );
  }

  if (process.env.MONGODB_URL) {
    adapters.push(
      createPrismaAdapter("Prisma/MongoDB", process.env.MONGODB_URL),
    );
  }

  return adapters;
}

/**
 * Creates a fresh in-process Oxigraph store for use as an import source.
 * Defined here (not in import.suite.ts) to centralise the oxigraph import.
 */
export async function createSourceOxigraphStore(): Promise<AbstractDatastore> {
  const adapter = createOxigraphLocalAdapter();
  return adapter.setup();
}
