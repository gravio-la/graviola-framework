/**
 * Sample Graviola REST server for the testapp.
 *
 *   bun run dev:api                          # oxigraph (default), seeds from Turtle
 * On NixOS use engines from the flake shell:
 *   nix develop .#prisma6
 *   catalogToPrisma 6.19.1 && bun install   # once if catalog is on 7.x
 *   bun run setup:prisma
 *   GRAVIOLA_STORE=prisma bun run seed:api
 *   GRAVIOLA_STORE=prisma bun run dev:api
 *
 * Pair with the Vite app:
 *   VITE_STORE=rest VITE_GRAVIOLA_API=http://localhost:3010 bun run dev
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { serveGraviolaRest } from "@graviola/rest-server-hono";
import type { PersistenceManifest } from "@graviola/json-schema-prisma-utils";
import type { StoreBackendSpec } from "@graviola/store-factory";

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

function loadPersistenceManifest(): PersistenceManifest | undefined {
  const path = join(import.meta.dir, "prisma/persistence-manifest.json");
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf-8")) as PersistenceManifest;
}

function resolveBackend(): StoreBackendSpec {
  const kind = (process.env.GRAVIOLA_STORE ?? "oxigraph").toLowerCase();
  if (kind === "prisma") {
    const datasourceUrl = defaultPrismaDatasourceUrl;
    return {
      kind: "prisma",
      datasourceUrl,
      provider: process.env.GRAVIOLA_PRISMA_PROVIDER ?? "sqlite",
      prisma: createTestappPrismaClient(datasourceUrl),
      persistenceManifest: loadPersistenceManifest(),
    };
  }
  if (kind === "sparql") {
    const endpoint =
      process.env.GRAVIOLA_SPARQL_URL ?? process.env.OXIGRAPH_URL;
    if (!endpoint) {
      throw new Error("GRAVIOLA_STORE=sparql requires GRAVIOLA_SPARQL_URL");
    }
    return { kind: "sparql", endpoint, flavour: "oxigraph" };
  }
  return {
    kind: "oxigraph",
    initialData: exampleDataTurtle,
  };
}

const port = Number(process.env.PORT) || 3010;

const storeKind = (process.env.GRAVIOLA_STORE ?? "oxigraph").toLowerCase();
const serveSchema =
  storeKind === "prisma" ? toPrismaPersistenceSchema(schema) : schema;

const result = await serveGraviolaRest({
  schema: serveSchema,
  primaryFields,
  defaultPrefix,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  jsonldContext,
  backend: resolveBackend(),
  port,
  cors: true,
  enableLogger: true,
});

console.log(
  `testapp REST API at ${result.url}` +
    `\n  handshake: ${result.url}/.well-known/graviola-store` +
    `\n  types: ${result.typeNames.join(", ")}` +
    `\n  backend: ${process.env.GRAVIOLA_STORE ?? "oxigraph"}`,
);
