export type SparqlEndpointUrls = {
  base: string;
  store: string;
  query: string;
  update: string;
};

/** Normalize a SPARQL service base URL (strip path suffixes and trailing slashes). */
export function normalizeSparqlBase(endpoint: string): string {
  let base = endpoint.replace(/\/+$/, "");
  base = base.replace(/\/(query|update|store|sparql)$/, "");
  return base;
}

export function sparqlEndpointUrls(endpoint: string): SparqlEndpointUrls {
  const base = normalizeSparqlBase(endpoint);
  return {
    base,
    store: `${base}/store`,
    query: `${base}/query`,
    update: `${base}/update`,
  };
}

export function graphStoreUrl(storeBase: string, graph?: string): string {
  if (graph) {
    return `${storeBase}?graph=${encodeURIComponent(graph)}`;
  }
  return `${storeBase}?default`;
}
