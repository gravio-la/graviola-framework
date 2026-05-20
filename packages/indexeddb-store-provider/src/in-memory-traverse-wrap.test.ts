import { describe, expect, test } from "bun:test";
import type { SparqlBuildOptions } from "@graviola/edb-core-types";
import { initSPARQLDatastorePair } from "@graviola/sparql-db-impl";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import N3 from "n3";
import type { JSONSchema7 } from "json-schema";
import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";
import { wrapSparqlStoreWithInMemoryTraverseLoad } from "./wrapTraverseInMemoryStore";

const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

const ex = (local: string) => namedNode(`http://example.org/${local}`);
const rdf = (local: string) =>
  namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#${local}`);
const xsd = (local: string) =>
  namedNode(`http://www.w3.org/2001/XMLSchema#${local}`);

const ALICE_ONLY = [
  quad(ex("Alice"), rdf("type"), ex("Person"), defaultGraph()),
  quad(ex("Alice"), ex("name"), literal("Alice"), defaultGraph()),
  quad(ex("Alice"), ex("age"), literal("30", xsd("integer")), defaultGraph()),
];

const TWO_PEOPLE = [
  ...ALICE_ONLY,
  quad(ex("Bob"), rdf("type"), ex("Person"), defaultGraph()),
  quad(ex("Bob"), ex("name"), literal("Bob"), defaultGraph()),
  quad(ex("Bob"), ex("age"), literal("25", xsd("integer")), defaultGraph()),
];

const PERSON_SCHEMA = {
  type: "object",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: "http://example.org/Person" },
        name: { type: "string" },
        age: { type: "integer" },
        knows: { $ref: "#/definitions/Person" },
      },
    },
  },
} satisfies JSONSchema7;

const QUERY_BUILD_OPTS: SparqlBuildOptions = {
  propertyToIRI: (p: string) => `http://example.org/${p}`,
  typeIRItoTypeName: (iri: string) => {
    const base = "http://example.org/";
    return iri.startsWith(base) ? iri.slice(base.length) : iri;
  },
  primaryFields: { Person: { label: "name" } },
  primaryFieldExtracts: {},
};

const ALICE_IRI = "http://example.org/Alice";

const engine = new QueryEngine();

describe("wrapSparqlStoreWithInMemoryTraverseLoad", () => {
  test("traverse loadOne matches vanilla CONSTRUCT+traverse loadDocument", async () => {
    const store = new N3.Store();
    for (const q of ALICE_ONLY) store.addQuad(q);
    const fns = createComunicaCRUDFunctions(engine, store);

    const pair = initSPARQLDatastorePair({
      schema: PERSON_SCHEMA as JSONSchema7,
      jsonldContext: {},
      defaultPrefix: "http://example.org/",
      typeNameToTypeIRI: (tn) =>
        tn === "Person"
          ? "http://example.org/Person"
          : `http://example.org/${tn}`,
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      walkerOptions: {
        maxRecursion: 4,
        maxRecursionEachRef: 4,
        skipAtLevel: 10,
      },
      sparqlQueryFunctions: fns,
      defaultLimit: 10,
    });

    const wrapped = wrapSparqlStoreWithInMemoryTraverseLoad(pair.store, {
      traversableDataset: store,
      narrowFlatSelectFields: ["name"],
      defaultPrefix: "http://example.org/",
      rootSchema: PERSON_SCHEMA as JSONSchema7,
      walkerOptions: {
        maxRecursion: 4,
        maxRecursionEachRef: 4,
        skipAtLevel: 10,
      },
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      defaultLimit: 10,
      selectFetch: fns.selectFetch,
    });

    const legacy = await pair.abstractDatastore.loadDocument?.(
      "Person",
      ALICE_IRI,
    );
    const viaTraverse = await wrapped.loadOne("Person", ALICE_IRI);
    expect(viaTraverse).toMatchObject({
      "@id": ALICE_IRI,
      name: "Alice",
      age: 30,
    });
    expect(legacy).toMatchObject({
      "@id": ALICE_IRI,
      name: "Alice",
      age: 30,
    });
  });

  test("default flat SELECT projects fewer bindings than full schema projection", async () => {
    const store = new N3.Store();
    for (const q of TWO_PEOPLE) store.addQuad(q);
    const fns = createComunicaCRUDFunctions(engine, store);

    const pair = initSPARQLDatastorePair({
      schema: PERSON_SCHEMA as JSONSchema7,
      jsonldContext: {},
      defaultPrefix: "http://example.org/",
      typeNameToTypeIRI: (tn) =>
        tn === "Person"
          ? "http://example.org/Person"
          : `http://example.org/${tn}`,
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      walkerOptions: { maxRecursion: 4, maxRecursionEachRef: 4 },
      sparqlQueryFunctions: fns,
      defaultLimit: 50,
    });

    const wrapped = wrapSparqlStoreWithInMemoryTraverseLoad(pair.store, {
      traversableDataset: store,
      narrowFlatSelectFields: ["name"],
      defaultPrefix: "http://example.org/",
      rootSchema: PERSON_SCHEMA as JSONSchema7,
      walkerOptions: { maxRecursion: 4, maxRecursionEachRef: 4 },
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      defaultLimit: 50,
      selectFetch: fns.selectFetch,
    });

    const full = await pair.store.findDocumentsAsFlatResultSet(
      "Person",
      {},
      50,
    );
    const narrow = await wrapped.findDocumentsAsFlatResultSet("Person", {}, 50);

    const fullKeys = Object.keys(full.results.bindings[0] ?? {}).length;
    const narrowKeys = Object.keys(narrow.results.bindings[0] ?? {}).length;
    expect(narrowKeys).toBeLessThan(fullKeys);
    expect(narrow.head.vars.length).toBeLessThan(full.head.vars.length);
  });

  test("omitting narrowFlatSelectFields leaves findDocumentsAsFlatResultSet same reference as base", async () => {
    const store = new N3.Store();
    for (const q of ALICE_ONLY) store.addQuad(q);
    const fns = createComunicaCRUDFunctions(engine, store);

    const pair = initSPARQLDatastorePair({
      schema: PERSON_SCHEMA as JSONSchema7,
      jsonldContext: {},
      defaultPrefix: "http://example.org/",
      typeNameToTypeIRI: (tn) =>
        tn === "Person"
          ? "http://example.org/Person"
          : `http://example.org/${tn}`,
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      walkerOptions: { maxRecursion: 4, maxRecursionEachRef: 4 },
      sparqlQueryFunctions: fns,
      defaultLimit: 50,
    });

    const wrapped = wrapSparqlStoreWithInMemoryTraverseLoad(pair.store, {
      traversableDataset: store,
      defaultPrefix: "http://example.org/",
      rootSchema: PERSON_SCHEMA as JSONSchema7,
      walkerOptions: { maxRecursion: 4, maxRecursionEachRef: 4 },
      queryBuildOptions: {
        ...QUERY_BUILD_OPTS,
        sparqlFlavour: "default",
      },
      defaultLimit: 50,
      selectFetch: fns.selectFetch,
    });

    expect(wrapped.findDocumentsAsFlatResultSet).toBe(
      pair.store.findDocumentsAsFlatResultSet,
    );
  });
});
