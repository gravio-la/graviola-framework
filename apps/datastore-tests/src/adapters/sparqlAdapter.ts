/**
 * Remote SPARQL HTTP adapter.
 *
 * Connects to an HTTP SPARQL endpoint (Oxigraph Docker, Blazegraph, etc.).
 * Activated by environment variables:
 *   OXIGRAPH_URL   — e.g. http://localhost:7878   (Oxigraph)
 *   BLAZEGRAPH_URL — e.g. http://localhost:9999/bigdata  (Blazegraph)
 *
 * Oxigraph HTTP endpoints:
 *   Query:  GET/POST ${base}/query
 *   Update: POST     ${base}/update
 *
 * Blazegraph HTTP endpoints:
 *   Query:  POST ${base}/sparql
 *   Update: POST ${base}/sparql  (with application/sparql-update content-type)
 */
import type { AbstractDatastore } from "@graviola/edb-global-types";
import type { CRUDFunctions } from "@graviola/edb-core-types";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import type { SPARQLFlavour } from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import N3 from "n3";

import {
  rawTestSchema,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  queryBuildOptions,
  BASE_IRI,
} from "../schema/testSchema";
import type { DatastoreAdapter } from "../types";

type EndpointConfig = {
  queryUrl: string;
  updateUrl: string;
  flavour: SPARQLFlavour;
};

function buildEndpointConfig(
  baseUrl: string,
  type: "oxigraph" | "blazegraph",
): EndpointConfig {
  const base = baseUrl.replace(/\/$/, "");
  if (type === "blazegraph") {
    return {
      queryUrl: `${base}/sparql`,
      updateUrl: `${base}/sparql`,
      flavour: "blazegraph",
    };
  }
  return {
    queryUrl: `${base}/query`,
    updateUrl: `${base}/update`,
    flavour: "oxigraph",
  };
}

function makeHttpCRUDFunctions(cfg: EndpointConfig): CRUDFunctions {
  const { queryUrl, updateUrl } = cfg;

  return {
    askFetch: async (query: string): Promise<boolean> => {
      const res = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-query",
          Accept: "application/sparql-results+json",
        },
        body: query,
      });
      if (!res.ok) {
        throw new Error(`ASK failed (${res.status}): ${await res.text()}`);
      }
      const json = await res.json();
      return json.boolean === true;
    },

    constructFetch: async (query: string) => {
      const res = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-query",
          Accept: "text/turtle",
        },
        body: query,
      });
      if (!res.ok) {
        throw new Error(
          `CONSTRUCT failed (${res.status}): ${await res.text()}`,
        );
      }
      const turtle = await res.text();
      const parser = new N3.Parser({ format: "Turtle" });
      const quads = parser.parse(turtle);
      return datasetFactory.dataset(quads as any);
    },

    updateFetch: async (query: string) => {
      const res = await fetch(updateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sparql-update" },
        body: query,
      });
      if (!res.ok) {
        throw new Error(`UPDATE failed (${res.status}): ${await res.text()}`);
      }
    },

    selectFetch: ((query: string, options?: { withHeaders?: boolean }) => {
      return fetch(queryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-query",
          Accept: "application/sparql-results+json",
        },
        body: query,
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(
              `SELECT failed (${res.status}): ${await res.text()}`,
            );
          }
          return res.json();
        })
        .then((json) =>
          options?.withHeaders ? json : (json.results?.bindings ?? []),
        );
    }) as CRUDFunctions["selectFetch"],
  };
}

export function createSparqlAdapter(
  name: string,
  baseUrl: string,
  type: "oxigraph" | "blazegraph",
): DatastoreAdapter {
  const cfg = buildEndpointConfig(baseUrl, type);

  return {
    name,

    capabilities: {
      crud: true,
      listDocuments: true,
      findDocuments: true,
      countDocuments: true,
      findDocumentsByLabel: true,
      findDocumentsByAuthorityIRI: false,
      findDocumentsAsFlatResultSet: true,
      getClasses: true,
      importDocuments: false,
      iterables: false,
      filterTyped: true,
      findEntityByTypeName: true,
    },

    setup: async () => {
      // Verify the endpoint is reachable before running tests
      const healthUrl = type === "blazegraph" ? cfg.queryUrl : cfg.queryUrl;
      try {
        const res = await fetch(healthUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sparql-query",
            Accept: "application/sparql-results+json",
          },
          body: "ASK { }",
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          throw new Error(`Endpoint health check failed with ${res.status}`);
        }
      } catch (e: any) {
        throw new Error(
          `${name}: endpoint ${baseUrl} is not reachable — ${e.message}`,
        );
      }

      const crudFunctions = makeHttpCRUDFunctions(cfg);

      return initSPARQLStore({
        schema: rawTestSchema as any,
        defaultPrefix: BASE_IRI,
        jsonldContext: { "@vocab": BASE_IRI },
        typeNameToTypeIRI,
        queryBuildOptions: {
          ...queryBuildOptions,
          sparqlFlavour: cfg.flavour,
        },
        sparqlQueryFunctions: crudFunctions,
        defaultLimit: 100,
      });
    },

    clearAll: async (_store: AbstractDatastore) => {
      const res = await fetch(cfg.updateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sparql-update" },
        body: "CLEAR ALL",
      });
      if (!res.ok) {
        throw new Error(
          `CLEAR ALL failed (${res.status}): ${await res.text()}`,
        );
      }
    },

    teardown: async () => {
      // HTTP connections are stateless; nothing to close
    },
  };
}
