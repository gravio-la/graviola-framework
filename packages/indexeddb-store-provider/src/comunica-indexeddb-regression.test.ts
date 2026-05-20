/**
 * Regression: Comunica over IndexedDBDataset must not spin unbounded
 * `match()` / metadata work (infinite loop under joins).
 *
 * Uses fake-indexeddb; counts Proxy `match` invocations for a JOIN SELECT.
 */

import "fake-indexeddb/auto";
import { describe, expect, test } from "bun:test";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { IndexedDBDataset } from "@graviola/indexeddb-dataset";
import N3 from "n3";

import { createComunicaCRUDFunctions } from "./comunica-sparql-adapter";

const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

let dbSeq = 0;
function newDbName(): string {
  return `comunica-regression-${++dbSeq}`;
}

const ex = (local: string) => namedNode(`http://example.org/${local}`);

function wrapMatchCount(ds: IndexedDBDataset): {
  proxy: IndexedDBDataset;
  getMatchCalls: () => number;
} {
  let matchCalls = 0;
  const proxy = new Proxy(ds, {
    get(target, prop, receiver) {
      if (prop === "match") {
        return (...args: unknown[]) => {
          matchCalls++;
          return Reflect.get(target, "match", receiver).apply(target, args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as IndexedDBDataset;
  return {
    proxy,
    getMatchCalls: () => matchCalls,
  };
}

describe("Comunica + IndexedDBDataset regression", () => {
  test("JOIN SELECT completes and match() is bounded (queryBindings path)", async () => {
    const ds = await IndexedDBDataset.open({
      dbName: newDbName(),
      bufferOptions: { flushIntervalMs: 0 },
    });

    const a = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    const Person = ex("Person");
    const name = ex("name");

    for (let i = 0; i < 8; i++) {
      const s = ex(`person${i}`);
      ds.add(quad(s, a, Person, defaultGraph()));
      ds.add(quad(s, name, literal(`Name ${i}`), defaultGraph()));
    }
    await ds.flush();

    const { proxy: proxyBindings, getMatchCalls: matchCallsBindings } =
      wrapMatchCount(ds);
    const engine = new QueryEngine();

    const sparql = `
      PREFIX ex: <http://example.org/>
      SELECT ?s ?n WHERE {
        ?s a ex:Person .
        ?s ex:name ?n .
      }
      LIMIT 50
    `;

    const bindingsStream = await engine.queryBindings(sparql, {
      sources: [proxyBindings as any],
    });
    const rows = await bindingsStream.toArray();

    expect(rows.length).toBe(8);
    const callsBindings = matchCallsBindings();
    expect(callsBindings).toBeGreaterThan(0);
    // Regression guard: pathological loops reach thousands+ quickly; healthy runs stay low.
    expect(callsBindings).toBeLessThan(800);

    const { proxy: proxyAdapter, getMatchCalls: matchCallsAdapter } =
      wrapMatchCount(ds);
    const crud = createComunicaCRUDFunctions(engine, proxyAdapter);
    const viaAdapter = await crud.selectFetch(sparql);
    expect(Array.isArray(viaAdapter)).toBe(true);
    expect((viaAdapter as unknown[]).length).toBe(8);
    expect(matchCallsAdapter()).toBeGreaterThan(0);
    expect(matchCallsAdapter()).toBeLessThan(800);

    ds.close();
  });
});
