import type { AuthConfig, FetchConfig } from "@graviola/edb-core-types";

import { createAuthHeaders, hasAuth } from "./authHelpers";

export const sparqlFetchConfigs = {
  ntriples: {
    accept: "application/n-triples,*/*;q=0.9",
    contentType: "application/sparql-query",
    cache: "no-cache" as RequestCache,
  },
  turtle: {
    accept: "text/turtle,*/*;q=0.9",
    contentType: "application/sparql-query",
    cache: "no-cache" as RequestCache,
  },
  sparqlResults: {
    accept: "application/sparql-results+json,*/*;q=0.9",
    contentType: "application/sparql-query",
    cache: "no-cache" as RequestCache,
  },
  sparqlUpdate: {
    accept: "*/*",
    contentType: "application/sparql-update",
  },
} as const;

export const createSparqlFetchFunction =
  (config: FetchConfig) =>
  (
    query: string,
    endpoint: string,
    auth?: AuthConfig,
    additionalHeaders?: Record<string, string>,
  ) => {
    const requestMode = config.cors || "cors";
    return fetch(endpoint, {
      headers: createAuthHeaders(
        {
          accept: config.accept,
          "content-type": config.contentType,
        },
        auth,
        additionalHeaders,
      ),
      body: query,
      method: "POST",
      mode: requestMode,
      ...(requestMode === "cors" && {
        credentials: hasAuth(auth) ? "include" : "omit",
      }),
      ...(config.cache && { cache: config.cache }),
    });
  };
