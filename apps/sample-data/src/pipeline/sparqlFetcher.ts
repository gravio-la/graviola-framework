import type { RDFSelectResult } from "@graviola/edb-core-types";
import type { WikidataSparqlFetcher } from "@graviola/edb-wikidata-utils";

const DEFAULT_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT =
  "GraviolaSampleData/0.1 (https://github.com/gravio-la/graviola-framework; sample-data generator)";

/**
 * Bun-friendly Wikidata SPARQL fetcher.
 * Sets a descriptive User-Agent (required by WDQS etiquette) and surfaces
 * non-JSON error bodies instead of failing inside res.json().
 */
export const createSampleDataSparqlFetcher = (
  endpoint: string = DEFAULT_ENDPOINT,
): WikidataSparqlFetcher => ({
  askFetch: async () => {
    throw new Error("askFetch is not used by sample-data");
  },
  constructFetch: async () => {
    throw new Error("constructFetch is not used by sample-data");
  },
  selectFetch: async (query: string) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/sparql-query",
        "User-Agent": USER_AGENT,
      },
      body: query,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `Wikidata SPARQL HTTP ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    try {
      return JSON.parse(text) as RDFSelectResult;
    } catch {
      throw new Error(
        `Wikidata SPARQL returned non-JSON (${res.status}): ${text.slice(0, 400)}`,
      );
    }
  },
});
