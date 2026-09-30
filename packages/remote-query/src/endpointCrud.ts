import type {
  CRUDFunctions,
  RDFSelectResult,
  SelectFetchOptions,
  SelectFetchOverload,
  SparqlEndpoint,
} from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import N3 from "n3";

import {
  createSparqlFetchFunction,
  sparqlFetchConfigs,
} from "./sparqlHttpFetch";

export type ConstructToNTriples = (response: Response) => Promise<string>;

export type SparqlEndpointCrudPreset = {
  accept: string;
  constructToNTriples: ConstructToNTriples;
  updateFetchImpl?: CRUDFunctions["updateFetch"];
};

const formSparqlResultsFetch = createSparqlFetchFunction({
  accept: sparqlFetchConfigs.sparqlResults.accept,
  contentType: "application/x-www-form-urlencoded",
  bodyFormat: "form-urlencoded",
  cache: "no-cache",
});

/**
 * Builds {@link CRUDFunctions} for a single SPARQL query URL with a preset
 * CONSTRUCT accept header and response-to-N-Triples conversion.
 */
export function createSparqlEndpointCrud(
  preset: SparqlEndpointCrudPreset,
): (endpoint: SparqlEndpoint) => CRUDFunctions {
  const fetchConstruct = createSparqlFetchFunction({
    accept: preset.accept,
    contentType: "application/x-www-form-urlencoded",
    bodyFormat: "form-urlencoded",
    cache: "no-cache",
  });

  return ({ endpoint: url, auth }: SparqlEndpoint) => ({
    askFetch: async (query: string) => {
      const res = await formSparqlResultsFetch(query, url, auth);
      const { boolean } = await res.json();
      return boolean === true;
    },

    constructFetch: async (query: string) => {
      const res = await fetchConstruct(query, url, auth);
      const ntriples = await preset.constructToNTriples(res);
      const reader = new N3.Parser();
      return datasetFactory.dataset(reader.parse(ntriples));
    },

    updateFetch:
      preset.updateFetchImpl ??
      (async (query: string) => {
        await fetchConstruct(query, url, auth);
      }),

    selectFetch: (async (query: string, options?: SelectFetchOptions) => {
      const res = await formSparqlResultsFetch(query, url, auth);
      const resultJson = (await res.json()) as RDFSelectResult;
      return options?.withHeaders ? resultJson : resultJson?.results?.bindings;
    }) as SelectFetchOverload,
  });
}
