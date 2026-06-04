import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import type { SparqlBuildOptions } from "@graviola/edb-core-types";
import { createComunicaCRUDFunctions } from "@graviola/indexeddb-store-provider";
import { wrapSparqlStoreWithInMemoryTraverseLoad } from "@graviola/indexeddb-store-provider";
import { loadSearchFacetSchema } from "@graviola/search-facet-schema";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import type { SparqlStore } from "@graviola/store-core";
import N3 from "n3";
import type { JSONSchema7 } from "json-schema";

const FIXTURES = dirname(fileURLToPath(import.meta.url));
const BASE_IRI = "http://example.org/ontology#";
const DEFAULT_PREFIX = "http://example.org/";

export const fixtureSchema = JSON.parse(
  readFileSync(join(FIXTURES, "schema.json"), "utf8"),
) as JSONSchema7;

// LinkML-style export uses $defs; Graviola SPARQL layer expects definitions.
if (!fixtureSchema.definitions && fixtureSchema.$defs) {
  fixtureSchema.definitions = fixtureSchema.$defs;
}

export const fixtureSidecar = loadSearchFacetSchema(
  JSON.parse(readFileSync(join(FIXTURES, "search-facet-sidecar.json"), "utf8")),
);

export const fixturePrimaryFields = {
  Exhibition: { label: "title", description: "description" },
  Artist: { label: "name", description: "bio" },
  Place: { label: "placeName", description: "description" },
  Curator: { label: "curatorName" },
};

const queryBuildOptions: SparqlBuildOptions = {
  propertyToIRI: (p: string) => `${BASE_IRI}${p}`,
  typeIRItoTypeName: (iri: string) => {
    if (iri.startsWith(BASE_IRI)) return iri.slice(BASE_IRI.length);
    if (iri.startsWith(DEFAULT_PREFIX)) return iri.slice(DEFAULT_PREFIX.length);
    return iri;
  },
  primaryFields: fixturePrimaryFields,
  primaryFieldExtracts: {},
  sparqlFlavour: "default",
};

export async function createFixturePrimaryStore(): Promise<
  SparqlStore<Record<string, unknown>>
> {
  const turtle = readFileSync(join(FIXTURES, "data.ttl"), "utf8");
  const store = new N3.Store();
  const parser = new N3.Parser();
  for (const quad of parser.parse(turtle)) {
    store.addQuad(quad);
  }

  const engine = new QueryEngine();
  const fns = createComunicaCRUDFunctions(engine, store);

  const base = initSPARQLStore({
    schema: fixtureSchema,
    jsonldContext: { "@vocab": BASE_IRI },
    defaultPrefix: BASE_IRI,
    typeNameToTypeIRI: (typeName) => `${BASE_IRI}${typeName}`,
    queryBuildOptions,
    walkerOptions: { maxRecursion: 2, skipAtLevel: 2 },
    sparqlQueryFunctions: fns,
    defaultLimit: 100,
  });

  return wrapSparqlStoreWithInMemoryTraverseLoad(base, {
    traversableDataset: store,
    defaultPrefix: BASE_IRI,
    rootSchema: fixtureSchema,
    queryBuildOptions,
    walkerOptions: { maxRecursion: 2, skipAtLevel: 2 },
    defaultLimit: 100,
    selectFetch: fns.selectFetch,
  });
}
