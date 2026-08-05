#!/usr/bin/env bun
/**
 * CLI: graviola-rest-serve <schema-module>
 *
 * The schema module must default-export or named-export:
 *   { schema, primaryFields?, defaultPrefix?, typeNameToTypeIRI?, typeIRItoTypeName? }
 *
 * Backend is resolved from GRAVIOLA_STORE / DATABASE_URL / GRAVIOLA_SPARQL_URL.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { serveGraviolaRest } from "./serveGraviolaRest.js";

async function main() {
  const schemaPath = process.argv[2];
  if (!schemaPath) {
    console.error(
      "Usage: graviola-rest-serve <schema-module.ts>\n" +
        "  GRAVIOLA_STORE=oxigraph|sparql|prisma\n" +
        "  PORT=3010",
    );
    process.exit(1);
  }

  const abs = resolve(process.cwd(), schemaPath);
  const mod = await import(pathToFileURL(abs).href);
  const schemaBundle = mod.default ?? mod;
  const schema = schemaBundle.schema ?? mod.schema;
  if (!schema) {
    console.error(
      `Module ${schemaPath} must export { schema } (named or default.schema)`,
    );
    process.exit(1);
  }

  const result = await serveGraviolaRest({
    schema,
    primaryFields: schemaBundle.primaryFields ?? mod.primaryFields,
    defaultPrefix: schemaBundle.defaultPrefix ?? mod.defaultPrefix,
    typeNameToTypeIRI: schemaBundle.typeNameToTypeIRI ?? mod.typeNameToTypeIRI,
    typeIRItoTypeName: schemaBundle.typeIRItoTypeName ?? mod.typeIRItoTypeName,
    jsonldContext: schemaBundle.jsonldContext ?? mod.jsonldContext,
    port: Number(process.env.PORT) || 3010,
  });

  console.log(
    `Graviola REST store listening at ${result.url}` +
      `\n  types: ${result.typeNames.join(", ")}` +
      `\n  handshake: ${result.url}/.well-known/graviola-store`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
