/**
 * Shared Prisma client for the testapp server (generated under server/prisma/generated).
 * Run `bun run setup:prisma` inside `nix develop .#prisma6` first.
 */
import { createRequire } from "node:module";
import { join } from "path";

const require = createRequire(import.meta.url);
const clientPath = join(import.meta.dir, "prisma/generated/client");

export function createTestappPrismaClient(datasourceUrl: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require(clientPath) as {
    PrismaClient: new (args?: {
      datasources?: { db?: { url?: string } };
    }) => Record<string, unknown> & { $disconnect: () => Promise<void> };
  };
  return new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
  });
}

export const defaultPrismaDatasourceUrl =
  process.env.DATABASE_URL ??
  process.env.SQLITE_URL ??
  "file:./server/prisma/dev.db";
