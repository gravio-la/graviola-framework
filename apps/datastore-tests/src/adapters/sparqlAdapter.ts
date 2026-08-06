/**
 * Remote SPARQL HTTP adapter.
 *
 * Connects to an HTTP SPARQL endpoint (Oxigraph Docker, Blazegraph, Jena Fuseki, etc.).
 * Activated by environment variables:
 *   OXIGRAPH_URL   — e.g. http://localhost:7878   (Oxigraph)
 *   BLAZEGRAPH_URL — e.g. http://localhost:9999/bigdata  (Blazegraph)
 *   FUSEKI_URL     — e.g. http://localhost:3030/ds  (Jena Fuseki dataset base)
 *
 * Oxigraph HTTP endpoints:
 *   Query:  GET/POST ${base}/query
 *   Update: POST     ${base}/update
 *
 * Blazegraph HTTP endpoints:
 *   Query:  POST ${base}/sparql
 *   Update: POST ${base}/sparql  (with application/sparql-update content-type)
 *
 * Fuseki (TDB) HTTP endpoints:
 *   Query:  POST ${base}/sparql
 *   Update: POST ${base}/update
 */
import { initSPARQLDatastorePair } from "@graviola/sparql-db-impl";
import type { SPARQLFlavour } from "@graviola/edb-core-types";
import { createHttpSparqlCrudFunctions } from "@graviola/remote-query-implementations";

import {
  rawTestSchema,
  typeNameToTypeIRI,
  queryBuildOptions,
  BASE_IRI,
} from "../schema/testSchema";
import { sparqlStatementNodeMetaConfig } from "../schema/statementTestConfig";
import type {
  DatastoreAdapter,
  DatastoreContractStore,
  DatastoreContractStoreWithStatements,
} from "../types";

type EndpointConfig = {
  queryUrl: string;
  updateUrl: string;
  flavour: SPARQLFlavour;
};

function buildEndpointConfig(
  baseUrl: string,
  type: "oxigraph" | "blazegraph" | "fuseki",
): EndpointConfig {
  const base = baseUrl.replace(/\/$/, "");
  if (type === "blazegraph") {
    return {
      queryUrl: `${base}/sparql`,
      updateUrl: `${base}/sparql`,
      flavour: "blazegraph",
    };
  }
  if (type === "fuseki") {
    return {
      queryUrl: `${base}/sparql`,
      updateUrl: `${base}/update`,
      // Jena ≥ 4.7 — LATERAL nested pagination (jena profile)
      flavour: "jena",
    };
  }
  return {
    queryUrl: `${base}/query`,
    updateUrl: `${base}/update`,
    // Oxigraph ≥ 0.3.11 — BIND + LATERAL (oxigraph profile)
    flavour: "oxigraph",
  };
}

export function createSparqlAdapter(
  name: string,
  baseUrl: string,
  type: "oxigraph" | "blazegraph" | "fuseki",
): DatastoreAdapter {
  const cfg = buildEndpointConfig(baseUrl, type);

  return {
    name,

    setup: async () => {
      // Verify the endpoint is reachable before running tests
      try {
        const res = await fetch(cfg.queryUrl, {
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

      const crudFunctions = createHttpSparqlCrudFunctions({
        queryUrl: cfg.queryUrl,
        updateUrl: cfg.updateUrl,
      });

      const { store } = initSPARQLDatastorePair({
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

      const { store: statementStore } = initSPARQLDatastorePair({
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
        statementMeta: sparqlStatementNodeMetaConfig,
      });

      return {
        store: store as DatastoreContractStore,
        statementStore: statementStore as DatastoreContractStoreWithStatements,
      };
    },

    clearAll: async () => {
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
