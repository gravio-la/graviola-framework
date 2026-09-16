/**
 * CBD boundary contract for the SPARQL write path (in-process Oxigraph).
 *
 * Regression: in the portal preview (exhibition-demo), saving a `Location`
 * with `parent` → another `Location` (or importing one from Wikidata) wiped
 * the parent chain ("Spain", "Málaga Province") from the primary DB, and
 * setting `location` on a `Place` dropped its `parent`, and vice versa.
 *
 * Root cause: the LinkML → JSON Schema artifact declares `@type` but no
 * `@id` on any class, so `jsonSchema2construct`'s TBox stop-symbol guard
 * (`["@id"]`) never fired and the DELETE template of `save` expanded four
 * levels deep into *linked named entities*, deleting all their triples.
 *
 * This suite runs the real store against exactly that schema shape and
 * asserts that only the subject's own CBD (blank-node sub-objects) is ever
 * replaced, never a linked IRI.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import { initSPARQLDatastorePair } from "@graviola/sparql-db-impl";
import datasetFactory from "@rdfjs/dataset";
import type { Quad } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";
import { Store } from "oxigraph";

const BASE = "https://example.org/exhibition-demo/";
const ENTITY = `${BASE}entity/`;
const typeNameToTypeIRI = (n: string) => `${BASE}${n}`;
const typeIRItoTypeName = (iri: string) => iri.replace(BASE, "");
const iri = (type: string, id: string) => `${ENTITY}${type}/${id}`;

/** Exact shape produced by the LinkML generator when no identifier slot exists. */
const schemaWithoutIds = {
  type: "object",
  definitions: {
    AuthorityLink: {
      type: "object",
      properties: {
        "@type": { type: "string", const: `${BASE}AuthorityLink` },
        authority: { type: "string", format: "uri" },
        id: { type: "string" },
      },
    },
    Location: {
      type: "object",
      required: ["title"],
      properties: {
        "@type": { type: "string", const: `${BASE}Location` },
        title: { type: "string" },
        country: { type: "string" },
        description: { type: "string" },
        idAuthority: { $ref: "#/definitions/AuthorityLink" },
        parent: { $ref: "#/definitions/Location" },
      },
    },
    Place: {
      type: "object",
      required: ["title"],
      properties: {
        "@type": { type: "string", const: `${BASE}Place` },
        title: { type: "string" },
        location: { $ref: "#/definitions/Location" },
        parent: { $ref: "#/definitions/Location" },
        idAuthority: { $ref: "#/definitions/AuthorityLink" },
      },
    },
  },
} satisfies JSONSchema7;

/** Same schema with `@id` declared (the framework's documented contract). */
const schemaWithIds: JSONSchema7 = JSON.parse(JSON.stringify(schemaWithoutIds));
for (const name of ["Location", "Place"]) {
  (schemaWithIds.definitions![name] as JSONSchema7).properties!["@id"] = {
    type: "string",
  };
}

function makeCRUD(store: Store): CRUDFunctions {
  return {
    askFetch: async (q) => Boolean(store.query(q)),
    constructFetch: async (q) =>
      datasetFactory.dataset((store.query(q) as Quad[]) ?? []),
    updateFetch: async (q) => {
      store.update(q);
    },
    selectFetch: (async (q: string, options?: { withHeaders?: boolean }) => {
      const parsed = JSON.parse(
        (store.query(q, {
          results_format: "application/sparql-results+json",
        }) as string) || "{}",
      );
      return options?.withHeaders ? parsed : (parsed.results?.bindings ?? []);
    }) as CRUDFunctions["selectFetch"],
  };
}

/** All triples with a given IRI as subject, as `p → o[]` (sorted, stable). */
function cbdOf(store: Store, subject: string): Record<string, string[]> {
  const rows = JSON.parse(
    store.query(`SELECT ?p ?o WHERE { <${subject}> ?p ?o } ORDER BY ?p ?o`, {
      results_format: "application/sparql-results+json",
    }) as string,
  ).results.bindings as Array<{ p: { value: string }; o: { value: string } }>;
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.p.value] ??= []).push(r.o.value);
  return out;
}

function countTriples(store: Store): number {
  const rows = JSON.parse(
    store.query(`SELECT (COUNT(*) AS ?c) WHERE { ?s ?p ?o }`, {
      results_format: "application/sparql-results+json",
    }) as string,
  ).results.bindings;
  return Number(rows[0].c.value);
}

for (const [label, schema] of [
  ["schema WITHOUT @id (LinkML artifact shape)", schemaWithoutIds],
  ["schema WITH @id (documented contract)", schemaWithIds],
] as const) {
  describe(`SPARQL save — CBD boundary — ${label}`, () => {
    let oxi: Store;
    let store: ReturnType<typeof initSPARQLDatastorePair>["store"];

    const spain = iri("Location", "spain");
    const malagaProvince = iri("Location", "malaga-province");
    const andalusia = iri("Location", "andalusia");
    const malagaCity = iri("Location", "malaga-city");
    const placeMalaga = iri("Place", "malaga");

    beforeEach(async () => {
      oxi = new Store();
      store = initSPARQLDatastorePair({
        schema: schema as any,
        defaultPrefix: ENTITY,
        jsonldContext: { "@vocab": ENTITY },
        typeNameToTypeIRI,
        queryBuildOptions: {
          propertyToIRI: (p: string) => `${ENTITY}${p}`,
          typeIRItoTypeName,
          primaryFields: {
            Location: { label: "title" },
            Place: { label: "title" },
          },
          primaryFieldExtracts: {},
          sparqlFlavour: "oxigraph",
        },
        sparqlQueryFunctions: makeCRUD(oxi),
        defaultLimit: 100,
      }).store;

      await store.upsert("Location", spain, {
        title: "Spain",
        country: "ES",
        idAuthority: { authority: "http://www.wikidata.org/", id: "Q29" },
      } as never);
      await store.upsert("Location", malagaProvince, {
        title: "Málaga Province",
        country: "ES",
        parent: { "@id": spain },
        idAuthority: { authority: "http://www.wikidata.org/", id: "Q95028" },
      } as never);
    });

    test("saving a child Location leaves the parent chain fully intact", async () => {
      const spainBefore = cbdOf(oxi, spain);
      const provinceBefore = cbdOf(oxi, malagaProvince);
      expect(Object.keys(spainBefore).length).toBeGreaterThan(2);
      expect(provinceBefore[`${ENTITY}parent`]).toEqual([spain]);

      await store.upsert("Location", malagaCity, {
        title: "Málaga",
        parent: { "@id": malagaProvince },
      } as never);

      expect(cbdOf(oxi, spain)).toEqual(spainBefore);
      expect(cbdOf(oxi, malagaProvince)).toEqual(provinceBefore);

      const loaded = await store.loadOne("Location", malagaCity);
      expect((loaded as any)?.parent?.["@id"]).toBe(malagaProvince);
    });

    test("re-saving the parent itself (e.g. after Wikidata import) keeps its own parent", async () => {
      // Simulate the import/edit round-trip: load, tweak, save.
      const loaded = (await store.loadOne("Location", malagaProvince)) as any;
      expect(loaded?.parent?.["@id"]).toBe(spain);
      await store.upsert("Location", malagaProvince, {
        ...loaded,
        description: "Province in Andalusia",
      } as never);

      const after = cbdOf(oxi, malagaProvince);
      expect(after[`${ENTITY}parent`]).toEqual([spain]);
      expect(after[`${ENTITY}title`]).toEqual(["Málaga Province"]);
      expect(after[`${ENTITY}description`]).toEqual(["Province in Andalusia"]);
      // and Spain (2 levels up from nothing in particular) is untouched
      expect(cbdOf(oxi, spain)[`${ENTITY}title`]).toEqual(["Spain"]);
    });

    test("changing the parent removes the stale link and keeps exactly one value", async () => {
      await store.upsert("Location", andalusia, {
        title: "Andalusia",
      } as never);
      await store.upsert("Location", malagaCity, {
        title: "Málaga",
        parent: { "@id": malagaProvince },
      } as never);
      await store.upsert("Location", malagaCity, {
        title: "Málaga",
        parent: { "@id": andalusia },
      } as never);

      expect(cbdOf(oxi, malagaCity)[`${ENTITY}parent`]).toEqual([andalusia]);
      // the previously linked target survives the re-link
      expect(cbdOf(oxi, malagaProvince)[`${ENTITY}title`]).toEqual([
        "Málaga Province",
      ]);
    });

    test("Place: setting `location` does not drop `parent` and vice versa", async () => {
      await store.upsert("Place", placeMalaga, {
        title: "Málaga",
        parent: { "@id": malagaProvince },
      } as never);
      const p1 = (await store.loadOne("Place", placeMalaga)) as any;
      expect(p1?.parent?.["@id"]).toBe(malagaProvince);

      await store.upsert("Place", placeMalaga, {
        ...p1,
        location: { "@id": spain },
      } as never);
      const p2 = (await store.loadOne("Place", placeMalaga)) as any;
      expect(p2?.parent?.["@id"]).toBe(malagaProvince);
      expect(p2?.location?.["@id"]).toBe(spain);

      // linked targets still intact
      expect(cbdOf(oxi, spain)[`${ENTITY}title`]).toEqual(["Spain"]);
      expect(cbdOf(oxi, malagaProvince)[`${ENTITY}parent`]).toEqual([spain]);
    });

    test("anonymous sub-objects (blank nodes) ARE replaced on save — no orphans", async () => {
      const before = countTriples(oxi);
      await store.upsert("Location", spain, {
        title: "Spain",
        country: "ES",
        idAuthority: { authority: "http://d-nb.info/gnd/", id: "4055964-6" },
      } as never);
      // old AuthorityLink blank node (3 triples: type, authority, id) fully gone,
      // new one written → triple count unchanged
      expect(countTriples(oxi)).toBe(before);
      const loaded = (await store.loadOne("Location", spain)) as any;
      expect(loaded?.idAuthority?.id).toBe("4055964-6");
      const orphan = oxi.query(`ASK { ?b <${ENTITY}id> "Q29" }`) as boolean;
      expect(orphan).toBe(false);
    });

    test("remove() deletes only the subject's CBD", async () => {
      await store.upsert("Location", malagaCity, {
        title: "Málaga",
        parent: { "@id": malagaProvince },
      } as never);
      await store.remove("Location", malagaCity);
      expect(Object.keys(cbdOf(oxi, malagaCity))).toHaveLength(0);
      expect(cbdOf(oxi, malagaProvince)[`${ENTITY}parent`]).toEqual([spain]);
      expect(cbdOf(oxi, spain)[`${ENTITY}title`]).toEqual(["Spain"]);
    });
  });
}
