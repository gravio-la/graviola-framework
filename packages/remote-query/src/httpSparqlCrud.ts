import type {
  AuthConfig,
  CRUDFunctions,
  RDFSelectResult,
  SelectFetchOptions,
  SelectFetchOverload,
} from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import N3 from "n3";

import {
  createSparqlFetchFunction,
  sparqlFetchConfigs,
} from "./sparqlHttpFetch";

const fetchNTriples = createSparqlFetchFunction(sparqlFetchConfigs.ntriples);
const fetchTurtle = createSparqlFetchFunction(sparqlFetchConfigs.turtle);
const fetchSPARQLResults = createSparqlFetchFunction(
  sparqlFetchConfigs.sparqlResults,
);
const fetchSPARQLUpdate = createSparqlFetchFunction(
  sparqlFetchConfigs.sparqlUpdate,
);

export type HttpSparqlCrudOptions = {
  queryUrl: string;
  updateUrl: string;
  auth?: AuthConfig;
  /**
   * CONSTRUCT response shape. Default `"turtle"` (many endpoints).
   * Use `"ntriples"` for Oxigraph-style HTTP (matches previous `oxigraphCrudOptions`).
   */
  constructResultFormat?: "turtle" | "ntriples";
};

/**
 * Builds {@link CRUDFunctions} for a SPARQL 1.1 HTTP endpoint with separate
 * query and update URLs
 */
export function createHttpSparqlCrudFunctions(
  options: HttpSparqlCrudOptions,
): CRUDFunctions {
  const {
    queryUrl,
    updateUrl,
    auth,
    constructResultFormat = "turtle",
  } = options;

  const fetchConstruct =
    constructResultFormat === "ntriples" ? fetchNTriples : fetchTurtle;

  return {
    askFetch: async (query: string): Promise<boolean> => {
      const res = await fetchSPARQLResults(query, queryUrl, auth);
      if (!res.ok) {
        throw new Error(`ASK failed (${res.status}): ${await res.text()}`);
      }
      const json = await res.json();
      return json.boolean === true;
    },

    constructFetch: async (query: string) => {
      const res = await fetchConstruct(query, queryUrl, auth);
      if (!res.ok) {
        throw new Error(
          `CONSTRUCT failed (${res.status}): ${await res.text()}`,
        );
      }
      const body = await res.text();
      const parser =
        constructResultFormat === "ntriples"
          ? new N3.Parser()
          : new N3.Parser({ format: "Turtle" });
      const quads = parser.parse(body);
      return datasetFactory.dataset(quads as any);
    },

    updateFetch: async (query: string) => {
      const res = await fetchSPARQLUpdate(query, updateUrl, auth);
      if (!res.ok) {
        throw new Error(`UPDATE failed (${res.status}): ${await res.text()}`);
      }
    },

    selectFetch: (async (query: string, opts?: SelectFetchOptions) => {
      const res = await fetchSPARQLResults(query, queryUrl, auth);
      if (!res.ok) {
        throw new Error(`SELECT failed (${res.status}): ${await res.text()}`);
      }
      const resultJson = (await res.json()) as RDFSelectResult;
      return opts?.withHeaders ? resultJson : resultJson?.results?.bindings;
    }) as SelectFetchOverload,
  };
}
