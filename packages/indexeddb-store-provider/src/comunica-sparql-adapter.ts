/**
 * Comunica SPARQL adapter for IndexedDBDataset.
 *
 * Wraps @comunica/query-sparql-rdfjs QueryEngine to produce CRUDFunctions
 * compatible with the Graviola sparql-db-impl / initSPARQLStore API.
 *
 * Term → SPARQL JSON Results conversion follows the W3C SPARQL 1.1 JSON format:
 *   https://www.w3.org/TR/sparql11-results-json/
 *
 * Why Comunica over a hand-rolled SPARQL engine:
 *   Comunica already handles SPARQL 1.1 algebra, join ordering, OPTIONAL,
 *   FILTER, SERVICE, etc.  Its @comunica/query-sparql-rdfjs actor delegates
 *   triple pattern evaluation entirely to the RDFJS DatasetCore.match() method,
 *   so we get a full SPARQL engine with O(log n) index lookups for free.
 *
 * The CRUDFunctions contract (constructFetch / selectFetch / updateFetch /
 * askFetch) is defined in @graviola/edb-core-types and consumed by
 * initSPARQLStore from @graviola/sparql-db-impl.
 */

import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import N3 from "n3";
import type { IndexedDBDataset } from "@graviola/indexeddb-dataset";
import type {
  CRUDFunctions,
  SelectFetchOverload,
} from "@graviola/edb-core-types";
import type { Term, NamedNode, Literal } from "@rdfjs/types";

/**
 * Convert an RDFJS Term to a SPARQL JSON Results term object.
 */
function termToSparqlJson(term: Term): Record<string, string> {
  switch (term.termType) {
    case "NamedNode":
      return { type: "uri", value: term.value };

    case "BlankNode":
      return { type: "bnode", value: term.value };

    case "Literal": {
      const lit = term as Literal;
      const result: Record<string, string> = {
        type: "literal",
        value: lit.value,
      };
      if (lit.language) {
        result["xml:lang"] = lit.language;
      } else if (
        lit.datatype &&
        lit.datatype.value !== "http://www.w3.org/2001/XMLSchema#string"
      ) {
        result.datatype = lit.datatype.value;
      }
      return result;
    }

    case "DefaultGraph":
      return { type: "uri", value: "" };

    default:
      return { type: "uri", value: term.value };
  }
}

/**
 * Build a CRUDFunctions object backed by a Comunica QueryEngine over the
 * provided IndexedDBDataset.
 *
 * The sparqlFlavour for initSPARQLStore should be "default" (standard SPARQL 1.1),
 * not "oxigraph" — Comunica does not accept Oxigraph-specific syntax extensions.
 */
const TAG = "[IDB:adapter]";
const q = (query: string) => query.replace(/\s+/g, " ").trim().slice(0, 200);

export function createComunicaCRUDFunctions(
  engine: QueryEngine,
  dataset: IndexedDBDataset,
): CRUDFunctions {
  return {
    constructFetch: async (query: string) => {
      console.debug(`${TAG} CONSTRUCT`, q(query));
      try {
        const quadsStream = await engine.queryQuads(query, {
          sources: [dataset as any],
        });
        const store = new N3.Store();
        await new Promise<void>((resolve, reject) => {
          quadsStream.on("data", (quad: any) => store.add(quad));
          quadsStream.on("end", () => resolve());
          quadsStream.on("error", reject);
        });
        console.debug(`${TAG} CONSTRUCT → ${store.size} quads`);
        return store;
      } catch (err) {
        console.error(`${TAG} CONSTRUCT error`, err, "\nQuery:", query);
        throw err;
      }
    },

    selectFetch: (async (
      query: string,
      options?: { withHeaders?: boolean },
    ) => {
      console.debug(
        `${TAG} SELECT (withHeaders=${options?.withHeaders})`,
        q(query),
      );
      try {
        // Use engine.query() so we can call metadata() on the result wrapper.
        // queryBindings() calls result.execute() which strips the metadata() method.
        const queryResult = (await engine.query(query, {
          sources: [dataset as any],
        })) as any;

        const meta = await queryResult.metadata();
        const vars: string[] = (meta.variables as any[]).map(
          (v: any) => v.value ?? String(v),
        );
        console.debug(`${TAG} SELECT vars:`, vars);

        const bindingsStream = await queryResult.execute();
        const rawBindings = await bindingsStream.toArray();
        console.debug(`${TAG} SELECT → ${rawBindings.length} rows`);

        const bindings = rawBindings.map((binding: any) => {
          const row: Record<string, Record<string, string>> = {};
          for (const varName of vars) {
            const term = binding.get(varName);
            if (term) {
              row[varName] = termToSparqlJson(term as Term);
            }
          }
          return row;
        });

        const result = { head: { vars }, results: { bindings } };
        return options?.withHeaders ? result : bindings;
      } catch (err) {
        console.error(`${TAG} SELECT error`, err, "\nQuery:", query);
        throw err;
      }
    }) as SelectFetchOverload,

    updateFetch: async (query: string) => {
      console.debug(`${TAG} UPDATE`, q(query));
      try {
        await engine.queryVoid(query, { sources: [dataset as any] });
        const size = await dataset.getSize();
        console.debug(`${TAG} UPDATE done — store size now ${size}`);
      } catch (err) {
        console.error(`${TAG} UPDATE error`, err, "\nQuery:", query);
        throw err;
      }
    },

    askFetch: async (query: string) => {
      console.debug(`${TAG} ASK`, q(query));
      try {
        const result = await engine.queryBoolean(query, {
          sources: [dataset as any],
        });
        console.debug(`${TAG} ASK → ${result}`);
        return result;
      } catch (err) {
        console.error(`${TAG} ASK error`, err, "\nQuery:", query);
        throw err;
      }
    },
  };
}
