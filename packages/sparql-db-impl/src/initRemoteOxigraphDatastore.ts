import type { JSONSchema7 } from "json-schema";
import type { AbstractDatastore } from "@graviola/edb-global-types";
import { oxigraphCrudOptions } from "@graviola/remote-query-implementations";
import { sparqlEndpointUrls } from "@graviola/sparql-tools";

import type { SPARQLDataStoreConfig } from "./SPARQLDataStoreConfig";
import { initSPARQLAbstractDatastore } from "./initSPARQLStore";

export type InitRemoteOxigraphDatastoreOptions = Omit<
  SPARQLDataStoreConfig,
  "sparqlQueryFunctions"
> & {
  endpoint: string;
};

/** Non-React convenience initializer for CLI and server consumers. */
export function initRemoteOxigraphDatastore(
  opts: InitRemoteOxigraphDatastoreOptions,
): AbstractDatastore {
  const { endpoint, ...storeConfig } = opts;
  const { query } = sparqlEndpointUrls(endpoint);
  const crud = oxigraphCrudOptions({
    endpoint: query,
    provider: "oxigraph",
    active: true,
  });

  return initSPARQLAbstractDatastore({
    ...storeConfig,
    schema: storeConfig.schema as JSONSchema7,
    sparqlQueryFunctions: crud,
  });
}
