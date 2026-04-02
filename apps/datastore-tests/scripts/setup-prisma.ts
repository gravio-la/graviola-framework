#!/usr/bin/env bun
/**
 * Pre-test setup script for Prisma (CLI entry).
 *
 * Delegates to `setupPrismaCore.runPrismaSetupForUrl` with the URL implied by env
 * (POSTGRES_URL / MARIADB_URL / MONGODB_URL / default SQLITE_URL).
 *
 * Each Prisma adapter also runs the same setup on `setup()` so the generated
 * schema matches that adapter's provider when multiple Prisma backends run in one process.
 *
 * If SKIP_PRISMA=1 is set, this script exits immediately.
 */
import { runPrismaSetupForUrl } from "./setupPrismaCore";
import type { PrismaProvider } from "./setupPrismaCore";

if (process.env.SKIP_PRISMA === "1") {
  console.log("[setup-prisma] SKIP_PRISMA=1 — skipping Prisma setup.");
  process.exit(0);
}

function detectProvider(): PrismaProvider {
  if (process.env.POSTGRES_URL) return "postgresql";
  if (process.env.MARIADB_URL) return "mysql";
  if (process.env.MONGODB_URL) return "mongodb";
  return "sqlite";
}

function getDatabaseUrl(provider: PrismaProvider): string {
  switch (provider) {
    case "postgresql":
      return process.env.POSTGRES_URL!;
    case "mysql":
      return process.env.MARIADB_URL!;
    case "mongodb":
      return process.env.MONGODB_URL!;
    default:
      return process.env.SQLITE_URL ?? "file:./prisma/test.db";
  }
}

const provider = detectProvider();
const databaseUrl = getDatabaseUrl(provider);

try {
  runPrismaSetupForUrl(databaseUrl);
} catch (e) {
  console.error("[setup-prisma] failed:", e);
  process.exit(1);
}
