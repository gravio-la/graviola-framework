/**
 * Seed a Prisma database from the item-schema Turtle fixture.
 *
 * Recipe: parse Turtle into in-process Oxigraph, then importMany into Prisma.
 * Creation order is handled by Imports (dependency-first recursion + two-phase connect).
 *
 *   nix develop .#prisma6
 *   bun run setup:prisma
 *   GRAVIOLA_STORE=prisma bun run seed:api
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createStoreFromSpec } from "@graviola/store-factory";
import type { PersistenceManifest } from "@graviola/json-schema-prisma-utils";
import type { Imports } from "@graviola/store-core";

import {
  schema,
  primaryFields,
  defaultPrefix,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  jsonldContext,
  exampleDataTurtle,
} from "./schema-bundle.ts";
import {
  createTestappPrismaClient,
  defaultPrismaDatasourceUrl,
} from "./prismaClient.ts";
import { toPrismaPersistenceSchema } from "./prismaSchema.ts";

const datasourceUrl = defaultPrismaDatasourceUrl;
const provider = process.env.GRAVIOLA_PRISMA_PROVIDER ?? "sqlite";
const prismaSchema = toPrismaPersistenceSchema(schema);

const manifestPath = join(import.meta.dir, "prisma/persistence-manifest.json");
const persistenceManifest = JSON.parse(
  readFileSync(manifestPath, "utf-8"),
) as PersistenceManifest;

/** Expected minimum counts from the item fixture (assert after import). */
const EXPECTED_MIN: Record<string, number> = {
  Tag: 1,
  Category: 1,
  Item: 1,
};

const prisma = createTestappPrismaClient(datasourceUrl);

const source = await createStoreFromSpec({
  schema,
  primaryFields,
  defaultPrefix,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  jsonldContext,
  backend: { kind: "oxigraph", initialData: exampleDataTurtle },
});

const target = await createStoreFromSpec({
  schema: prismaSchema,
  primaryFields,
  defaultPrefix,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  jsonldContext,
  backend: {
    kind: "prisma",
    datasourceUrl,
    provider,
    prisma,
    persistenceManifest,
  },
});

const importStore = target.store as typeof target.store &
  Imports<Record<string, unknown>>;

if (typeof importStore.importMany !== "function") {
  console.error("Target store does not implement Imports.importMany");
  process.exit(1);
}

// Leaf types first — recursion still fills gaps if order differs.
const typeOrder = ["Tag", "Category", "Vendor", "Item"] as const;

for (const typeName of typeOrder) {
  if (!target.typeNames.includes(typeName)) continue;
  console.log(`importMany ${typeName}…`);
  await importStore.importMany(typeName, source.store as never, 1000);
}

let failed = false;
for (const [typeName, min] of Object.entries(EXPECTED_MIN)) {
  if (!target.typeNames.includes(typeName)) continue;
  const rows = await (target.store as { list: Function }).list(typeName, 10000);
  const count = Array.isArray(rows) ? rows.length : 0;
  console.log(`  ${typeName}: ${count} (expected ≥ ${min})`);
  if (count < min) {
    console.error(`FAIL: ${typeName} has ${count} rows, expected ≥ ${min}`);
    failed = true;
  }
}

// Spot-check photos round-trip on one item
const items = (await (target.store as { list: Function }).list(
  "Item",
  100,
)) as Record<string, unknown>[];
const withPhotos = items.find(
  (i) => Array.isArray(i.photos) && (i.photos as unknown[]).length > 0,
);
if (withPhotos) {
  console.log(
    `  sample photos (${String(withPhotos.name)}):`,
    withPhotos.photos,
  );
} else {
  console.warn("  WARN: no Item with photos after seed");
}

await source.dispose?.();
await target.dispose?.();
await prisma.$disconnect().catch(() => undefined);

if (failed) {
  process.exit(1);
}
console.log("Seed complete.");
