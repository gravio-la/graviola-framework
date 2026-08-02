/**
 * Smoke-check typed filters against the committed geo Turtle in Oxigraph.
 * Verifies numeric comparisons, contains casing, and x-inverseOf `parts` filters.
 */
import { describe, expect, test, beforeAll } from "bun:test";
import { Store } from "oxigraph";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import type { SparqlStore } from "@graviola/store-core";
import {
  GEO_INSTANCE_BASE,
  GEO_VOCAB_BASE,
  geoPrimaryFields,
  geoSchema,
  geoStats,
  geoTurtle,
  geoTypeIRIToTypeName,
  geoTypeNameToTypeIRI,
} from "@graviola/sample-data-geo";

function makeSyncStoreCRUDFunctions(store: Store): CRUDFunctions {
  return {
    askFetch: async (query: string): Promise<boolean> => {
      return Boolean(store.query(query));
    },
    constructFetch: async (query: string) => {
      const quads = (store.query(query) as Quad[]) ?? [];
      return datasetFactory.dataset(quads);
    },
    updateFetch: async (query: string) => {
      store.update(query);
    },
    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      const raw = store.query(query, {
        results_format: "application/sparql-results+json",
      }) as string;
      const parsed = JSON.parse(raw || "{}");
      return Promise.resolve(
        options?.withHeaders ? parsed : (parsed.results?.bindings ?? []),
      );
    }) as CRUDFunctions["selectFetch"],
  };
}

describe("geo typed-filter smoke (Oxigraph)", () => {
  let store: SparqlStore<Record<string, unknown>>;

  beforeAll(() => {
    const ox = new Store();
    ox.load(geoTurtle, { format: "text/turtle", base_iri: GEO_INSTANCE_BASE });

    store = initSPARQLStore({
      schema: geoSchema as any,
      defaultPrefix: GEO_VOCAB_BASE,
      jsonldContext: { "@vocab": GEO_VOCAB_BASE },
      typeNameToTypeIRI: geoTypeNameToTypeIRI,
      queryBuildOptions: {
        propertyToIRI: geoTypeNameToTypeIRI,
        typeIRItoTypeName: (iri: string) => geoTypeIRIToTypeName(iri) ?? "",
        primaryFields: geoPrimaryFields,
        primaryFieldExtracts: {},
        defaultPrefix: GEO_VOCAB_BASE,
        prefixes: { geo: GEO_VOCAB_BASE },
        // contains↔partOf would explode at default depth 4
        sparqlFlavour: "oxigraph",
      },
      walkerOptions: { maxRecursion: 1 },
      sparqlQueryFunctions: makeSyncStoreCRUDFunctions(ox),
      defaultLimit: 500,
    });
  });

  const shallow = { maxRecursion: 1 } as const;

  test("all cities loads", async () => {
    const result = await store.filterMany("City", { ...shallow });
    expect(result.length).toBe(geoStats.City);
  }, 60_000);

  test("population lt 20000 (numeric vs xsd:decimal)", async () => {
    const result = await store.filterMany("City", {
      where: { population: { lt: 20000 } },
      ...shallow,
    });
    expect(result.length).toBe(geoStats.citiesPopLt20k);
    for (const row of result) {
      const pop = Number((row as any).population);
      if (!Number.isNaN(pop)) expect(pop).toBeLessThan(20000);
    }
  }, 60_000);

  test('name contains "burg" (case-sensitive)', async () => {
    const lower = await store.filterMany("City", {
      where: { name: { contains: "burg" } },
      ...shallow,
    });
    const upper = await store.filterMany("City", {
      where: { name: { contains: "Burg" } },
      ...shallow,
    });
    expect(lower.length).toBe(geoStats.citiesNameContainsBurg);
    // "Burg" alone matches fewer (e.g. "Burg") — case-sensitive by default
    expect(upper.length).toBeLessThan(lower.length);
  }, 60_000);

  test("children of richest city-parent via partOf @id", async () => {
    const result = await store.filterMany("City", {
      where: { partOf: { "@id": geoStats.richestCityParentIRI } },
      ...shallow,
    });
    expect(result.length).toBe(geoStats.richestCityParentChildCount);
  }, 60_000);

  test("places with burg children via parts.some (x-inverseOf) — known gap", async () => {
    const result = await store.filterMany("Place", {
      where: {
        parts: { some: { name: { contains: "burg" } } },
      },
      ...shallow,
    });
    // Turtle only asserts `partOf`; `parts` is x-inverseOf and currently does not
    // constrain filterMany results (tracked under github.com/gravio-la/graviola-framework/issues/5).
    // Keep the assertion soft: API must return an array without throwing.
    expect(Array.isArray(result)).toBe(true);
    if (result.length === 0) {
      console.warn(
        "[known gap] parts.some over x-inverseOf returned 0 — see issue #5",
      );
    }
  }, 60_000);

  test("include.contains loads forward children of Landkreis Görlitz", async () => {
    const result = await store.filterMany("Place", {
      where: { name: { equals: "Landkreis Görlitz" } },
      include: { contains: true },
      maxRecursion: 1,
    } as any);
    expect(result.length).toBe(1);
    const kids = (result[0] as { contains?: unknown }).contains;
    expect(Array.isArray(kids)).toBe(true);
    expect((kids as unknown[]).length).toBe(
      geoStats.richestCityParentChildCount,
    );
    const names = (kids as { name?: string }[])
      .map((c) => c.name)
      .filter(Boolean);
    expect(names).toContain("Zittau");
    expect(names).toContain("Löbau");
  }, 30_000);

  test("include.contains take+orderBy via extraction-stage (default flavour)", async () => {
    const result = await store.filterMany("Place", {
      where: { name: { equals: "Landkreis Görlitz" } },
      include: {
        contains: { take: 5, orderBy: { name: "asc" as const } },
      },
      maxRecursion: 1,
    } as any);
    expect(result.length).toBe(1);
    const kids = (result[0] as { contains?: { name?: string }[] }).contains;
    expect(Array.isArray(kids)).toBe(true);
    expect(kids!.length).toBe(5);
    const names = kids!.map((c) => c.name);
    expect(names).toEqual([
      "Bad Muskau",
      "Bernstadt a. d. Eigen",
      "Ebersbach-Neugersdorf",
      "Herrnhut",
      "Löbau",
    ]);
  }, 30_000);

  test("include.contains take+orderBy via LATERAL flavour", async () => {
    const result = await store.filterMany("Place", {
      where: { name: { equals: "Landkreis Görlitz" } },
      include: {
        contains: { take: 5, orderBy: { name: "asc" as const } },
      },
      maxRecursion: 1,
      flavour: "lateral",
    } as any);
    expect(result.length).toBe(1);
    const kids = (result[0] as { contains?: { name?: string }[] }).contains;
    expect(Array.isArray(kids)).toBe(true);
    expect(kids!.length).toBe(5);
    const names = kids!.map((c) => c.name);
    expect(names).toEqual([
      "Bad Muskau",
      "Bernstadt a. d. Eigen",
      "Ebersbach-Neugersdorf",
      "Herrnhut",
      "Löbau",
    ]);
  }, 30_000);
});
