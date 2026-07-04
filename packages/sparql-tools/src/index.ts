import {
  graphStoreUrl,
  normalizeSparqlBase,
  sparqlEndpointUrls,
} from "./endpoints";

export { graphStoreUrl, normalizeSparqlBase, sparqlEndpointUrls };
export type { SparqlEndpointUrls } from "./endpoints";

export type DumpQuadsOptions = {
  endpoint: string;
  graph?: string;
};

export type LoadQuadsOptions = {
  endpoint: string;
  nquads: string;
  graph?: string;
};

export type ClearGraphOptions = {
  endpoint: string;
  graph?: string;
};

async function readResponseText(
  res: Response,
  context: string,
): Promise<string> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `${context} failed (${res.status} ${res.statusText})${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  return res.text();
}

async function dumpViaGraphStore(
  storeUrl: string,
  graph?: string,
): Promise<string | null> {
  const url = graphStoreUrl(storeUrl, graph);
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/n-quads" },
  });
  if (res.status === 404) {
    return null;
  }
  return readResponseText(res, `GSP GET ${url}`);
}

async function dumpViaConstruct(queryUrl: string): Promise<string> {
  const res = await fetch(queryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/n-triples",
    },
    body: "CONSTRUCT WHERE { ?s ?p ?o }",
  });
  return readResponseText(res, `CONSTRUCT fallback on ${queryUrl}`);
}

/** Dump all quads from a SPARQL endpoint via GSP, with CONSTRUCT fallback. */
export async function dumpQuads({
  endpoint,
  graph,
}: DumpQuadsOptions): Promise<string> {
  const { store, query } = sparqlEndpointUrls(endpoint);
  const gspResult = await dumpViaGraphStore(store, graph);
  if (gspResult !== null) {
    return gspResult;
  }
  return dumpViaConstruct(query);
}

/** Load N-Quads into a SPARQL endpoint via GSP POST. */
export async function loadQuads({
  endpoint,
  nquads,
  graph,
}: LoadQuadsOptions): Promise<void> {
  const { store } = sparqlEndpointUrls(endpoint);
  const url = graphStoreUrl(store, graph);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/n-quads" },
    body: nquads,
  });
  await readResponseText(res, `GSP POST ${url}`);
}

/** Clear the default graph or a named graph via SPARQL UPDATE. */
export async function clearGraph({
  endpoint,
  graph,
}: ClearGraphOptions): Promise<void> {
  const { update } = sparqlEndpointUrls(endpoint);
  const updateQuery = graph ? `CLEAR GRAPH <${graph}>` : "CLEAR DEFAULT";
  const res = await fetch(update, {
    method: "POST",
    headers: { "Content-Type": "application/sparql-update" },
    body: updateQuery,
  });
  await readResponseText(res, `SPARQL UPDATE on ${update}`);
}

/** Check whether a SPARQL HTTP service responds (any 2xx/4xx except network error). */
export async function isEndpointReachable(
  endpoint: string,
  timeoutMs = 2000,
): Promise<boolean> {
  const { query } = sparqlEndpointUrls(endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(query, {
      method: "POST",
      headers: { "Content-Type": "application/sparql-query" },
      body: "ASK {}",
      signal: controller.signal,
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
