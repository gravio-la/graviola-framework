/**
 * Integration tests for createComunicaCRUDFunctions.
 *
 * Tests the full pipeline:
 *   IndexedDBDataset (hexastore) → Comunica QueryEngine → CRUDFunctions
 *
 * Uses fake-indexeddb/auto to provide an in-memory IndexedDB and real Comunica
 * to execute SPARQL against the dataset — no mocks at the query layer.
 */

import "fake-indexeddb/auto";
import { describe, test, expect } from "bun:test";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { IndexedDBDataset } from "@graviola/indexeddb-dataset";
import N3 from "n3";
import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";

const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

const ex = (local: string) => namedNode(`http://example.org/${local}`);
const rdf = (local: string) =>
  namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#${local}`);
const xsd = (local: string) =>
  namedNode(`http://www.w3.org/2001/XMLSchema#${local}`);

// Shared engine — stateless and safe to reuse
const engine = new QueryEngine();

let seq = 0;
function newDbName() {
  return `test-adapter-${++seq}`;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Open an IndexedDBDataset, populate it with the given quads, and wrap it with
 * createComunicaCRUDFunctions.  Returns both so tests can close the DB after.
 */
async function makeAdapter(triples: N3.Quad[]) {
  const ds = await IndexedDBDataset.open({ dbName: newDbName() });
  await ds.import(triples);
  const fns = createComunicaCRUDFunctions(engine, ds);
  return { ds, fns };
}

// ─── fixtures ───────────────────────────────────────────────────────────────

const PEOPLE = [
  quad(ex("Alice"), rdf("type"), ex("Person"), defaultGraph()),
  quad(ex("Alice"), ex("name"), literal("Alice"), defaultGraph()),
  quad(ex("Alice"), ex("age"), literal("30", xsd("integer")), defaultGraph()),
  quad(ex("Bob"), rdf("type"), ex("Person"), defaultGraph()),
  quad(ex("Bob"), ex("name"), literal("Bob"), defaultGraph()),
  quad(ex("Bob"), ex("age"), literal("25", xsd("integer")), defaultGraph()),
  quad(ex("Alice"), ex("knows"), ex("Bob"), defaultGraph()),
];

// ─── SELECT tests ────────────────────────────────────────────────────────────

describe("selectFetch", () => {
  test("returns all triples with wildcard SELECT", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const bindings = (await fns.selectFetch(
        "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
      )) as any[];
      expect(bindings.length).toBe(PEOPLE.length);
    } finally {
      ds.close();
    }
  });

  test("filters by rdf:type — returns only entities of the requested type", async () => {
    // Mix of Person and Organization to verify the type filter is exclusive
    const { ds, fns } = await makeAdapter([
      ...PEOPLE,
      quad(ex("Acme"), rdf("type"), ex("Organization"), defaultGraph()),
      quad(ex("Acme"), ex("name"), literal("Acme Corp"), defaultGraph()),
    ]);
    try {
      const bindings = (await fns.selectFetch(`
        SELECT ?person WHERE {
          ?person <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
                  <http://example.org/Person> .
        }
      `)) as any[];

      expect(bindings.length).toBe(2);
      const iris = bindings.map((b: any) => b.person.value);
      expect(iris).toContain("http://example.org/Alice");
      expect(iris).toContain("http://example.org/Bob");
      // Organization must not appear
      expect(iris).not.toContain("http://example.org/Acme");
    } finally {
      ds.close();
    }
  });

  test("each binding row has the correct term types", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const bindings = (await fns.selectFetch(`
        SELECT ?name ?age WHERE {
          <http://example.org/Alice> <http://example.org/name> ?name ;
                                     <http://example.org/age>  ?age .
        }
      `)) as any[];
      expect(bindings.length).toBe(1);
      const row = bindings[0];
      expect(row.name.type).toBe("literal");
      expect(row.name.value).toBe("Alice");
      expect(row.age.type).toBe("literal");
      expect(row.age.datatype).toBe("http://www.w3.org/2001/XMLSchema#integer");
    } finally {
      ds.close();
    }
  });

  test("withHeaders: true returns head.vars alongside bindings", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const result = (await fns.selectFetch("SELECT ?s ?p WHERE { ?s ?p ?o }", {
        withHeaders: true,
      })) as any;
      expect(result).toHaveProperty("head");
      expect(result).toHaveProperty("results");
      expect(result.head.vars).toContain("s");
      expect(result.head.vars).toContain("p");
      expect(Array.isArray(result.results.bindings)).toBe(true);
    } finally {
      ds.close();
    }
  });

  test("returns empty bindings when no triples match", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const bindings = (await fns.selectFetch(`
        SELECT ?x WHERE { ?x <http://example.org/unknownPred> ?y }
      `)) as any[];
      expect(bindings.length).toBe(0);
    } finally {
      ds.close();
    }
  });

  test("ORDER BY and LIMIT are respected", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const bindings = (await fns.selectFetch(`
        SELECT ?name WHERE {
          ?person <http://example.org/name> ?name .
        }
        ORDER BY ASC(?name)
        LIMIT 1
      `)) as any[];
      expect(bindings.length).toBe(1);
      expect(bindings[0].name.value).toBe("Alice");
    } finally {
      ds.close();
    }
  });

  test("FILTER works", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const bindings = (await fns.selectFetch(`
        SELECT ?person ?age WHERE {
          ?person <http://example.org/age> ?age .
          FILTER(xsd:integer(?age) > 26)
        }
      `)) as any[];
      expect(bindings.length).toBe(1);
      expect(bindings[0].person.value).toBe("http://example.org/Alice");
    } finally {
      ds.close();
    }
  });
});

// ─── CONSTRUCT tests ─────────────────────────────────────────────────────────

describe("constructFetch", () => {
  test("CONSTRUCT returns a store with the requested triples", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const store = (await fns.constructFetch(`
        CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }
      `)) as N3.Store;
      expect(store.size).toBe(PEOPLE.length);
    } finally {
      ds.close();
    }
  });

  test("CONSTRUCT can reshape the graph", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const store = (await fns.constructFetch(`
        PREFIX ex: <http://example.org/>
        CONSTRUCT { ?person ex:label ?name }
        WHERE     { ?person ex:name ?name }
      `)) as N3.Store;
      expect(store.size).toBe(2);
      // All triples should use ex:label as predicate
      const quads = store.getQuads(null, ex("label"), null, null);
      expect(quads.length).toBe(2);
    } finally {
      ds.close();
    }
  });

  test("CONSTRUCT returns an empty store when WHERE matches nothing", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      const store = (await fns.constructFetch(`
        CONSTRUCT { ?s <http://example.org/foo> ?o }
        WHERE     { ?s <http://example.org/nonexistent> ?o }
      `)) as N3.Store;
      expect(store.size).toBe(0);
    } finally {
      ds.close();
    }
  });

  test("CONSTRUCT with OPTIONAL fills in partial results", async () => {
    const { ds, fns } = await makeAdapter(PEOPLE);
    try {
      // Alice has ex:knows; Bob does not — OPTIONAL makes the triple absent for Bob
      const store = (await fns.constructFetch(`
        PREFIX ex: <http://example.org/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        CONSTRUCT { ?person ex:type ex:Person . ?person ex:knows ?friend . }
        WHERE {
          ?person rdf:type ex:Person .
          OPTIONAL { ?person ex:knows ?friend . }
        }
      `)) as N3.Store;
      // 2 rdf:type triples + 1 ex:knows triple (only Alice knows Bob)
      expect(store.size).toBe(3);
    } finally {
      ds.close();
    }
  });
});

// ─── UPDATE (DELETE / INSERT) tests ──────────────────────────────────────────

describe("updateFetch", () => {
  test("DELETE WHERE removes matching triples", async () => {
    const { ds, fns } = await makeAdapter([
      quad(ex("Alice"), rdf("type"), ex("Person"), defaultGraph()),
      quad(ex("Alice"), ex("name"), literal("Alice"), defaultGraph()),
    ]);
    try {
      await fns.updateFetch(`
        DELETE { <http://example.org/Alice> <http://example.org/name> ?name }
        WHERE  { <http://example.org/Alice> <http://example.org/name> ?name }
      `);

      const bindings = (await fns.selectFetch(
        "SELECT ?p WHERE { <http://example.org/Alice> ?p ?o }",
      )) as any[];
      // name triple deleted; rdf:type still present
      expect(bindings.length).toBe(1);
      expect(bindings[0].p.value).toBe(
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );
    } finally {
      ds.close();
    }
  });

  test("DELETE/INSERT/WHERE replaces a property value", async () => {
    const { ds, fns } = await makeAdapter([
      quad(ex("Alice"), ex("name"), literal("Alice"), defaultGraph()),
    ]);
    try {
      await fns.updateFetch(`
        DELETE { <http://example.org/Alice> <http://example.org/name> ?old }
        INSERT { <http://example.org/Alice> <http://example.org/name> "Alice Updated" }
        WHERE  { <http://example.org/Alice> <http://example.org/name> ?old }
      `);

      const bindings = (await fns.selectFetch(`
        SELECT ?name WHERE { <http://example.org/Alice> <http://example.org/name> ?name }
      `)) as any[];
      expect(bindings.length).toBe(1);
      expect(bindings[0].name.value).toBe("Alice Updated");
    } finally {
      ds.close();
    }
  });

  test("DELETE/INSERT/WHERE with OPTIONAL mirrors the real save pattern", async () => {
    // Mirrors the Graviola-generated query: DELETE all existing props, INSERT new values
    const { ds, fns } = await makeAdapter([
      quad(ex("item/1"), rdf("type"), ex("Category"), defaultGraph()),
      quad(ex("item/1"), ex("name"), literal("Old Name"), defaultGraph()),
      quad(
        ex("item/1"),
        ex("description"),
        literal("Old Desc"),
        defaultGraph(),
      ),
    ]);
    try {
      await fns.updateFetch(`
        PREFIX ex: <http://example.org/>
        DELETE {
          <http://example.org/item/1> ex:name        ?name .
          <http://example.org/item/1> ex:description ?desc .
        }
        INSERT {
          <http://example.org/item/1> ex:name        "New Name" .
          <http://example.org/item/1> ex:description "New Desc" .
        }
        WHERE {
          OPTIONAL { <http://example.org/item/1> ex:name        ?name . }
          OPTIONAL { <http://example.org/item/1> ex:description ?desc . }
        }
      `);

      const bindings = (await fns.selectFetch(`
        SELECT ?p ?o WHERE { <http://example.org/item/1> ?p ?o }
        ORDER BY ?p
      `)) as any[];

      // rdf:type unchanged, name and description updated
      expect(bindings.length).toBe(3);
      const byPred: Record<string, string> = {};
      for (const b of bindings as any[]) byPred[b.p.value] = b.o.value;

      expect(byPred["http://example.org/name"]).toBe("New Name");
      expect(byPred["http://example.org/description"]).toBe("New Desc");
      expect(byPred["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]).toBe(
        "http://example.org/Category",
      );
    } finally {
      ds.close();
    }
  });
});
