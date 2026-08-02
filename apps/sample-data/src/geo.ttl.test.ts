import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { Parser, Store } from "n3";

const GEO_TTL = join(import.meta.dir, "../domains/geo/out/geo.ttl");
const BASE = "http://ontologies.gra.one/samples/geo#";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

const loadGeoStore = async (): Promise<Store> => {
  const ttl = await Bun.file(GEO_TTL).text();
  return new Store(new Parser().parse(ttl));
};

describe("geo sample Turtle", () => {
  test("parses cleanly and has expected entity counts", async () => {
    const store = await loadGeoStore();
    const cities = store.getSubjects(RDF_TYPE, `${BASE}City`, null);
    const places = store.getSubjects(RDF_TYPE, `${BASE}Place`, null);

    expect(cities.length).toBeGreaterThanOrEqual(50);
    expect(places.length).toBeGreaterThanOrEqual(20);
    expect(store.size).toBeGreaterThan(500);
  });

  test("every City has an integer-like population", async () => {
    const store = await loadGeoStore();
    const cities = store.getSubjects(RDF_TYPE, `${BASE}City`, null);
    const popPred = `${BASE}population`;

    expect(cities.length).toBeGreaterThan(0);
    for (const city of cities) {
      const pops = store.getObjects(city, popPred, null);
      expect(pops.length).toBeGreaterThanOrEqual(1);
      const value = Number(pops[0]!.value);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  test("contains at least one name with 'burg'", async () => {
    const store = await loadGeoStore();
    const names = store
      .getQuads(null, `${BASE}name`, null, null)
      .map((q) => q.object.value);
    const burg = names.filter((n) => /burg/i.test(n));
    expect(burg.length).toBeGreaterThanOrEqual(1);
  });

  test("has at least one partOf chain of depth 3+", async () => {
    const store = await loadGeoStore();
    const parent = new Map<string, string>();
    for (const q of store.getQuads(null, `${BASE}partOf`, null, null)) {
      parent.set(q.subject.value, q.object.value);
    }

    let found = false;
    for (const start of parent.keys()) {
      const chain = [start];
      let cur = start;
      while (parent.has(cur) && chain.length < 12) {
        cur = parent.get(cur)!;
        chain.push(cur);
      }
      if (chain.length >= 4) {
        // City → … → … → Country (4 nodes = 3 edges)
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
