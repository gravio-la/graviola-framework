import {
  getEntityFromWikidataByIRI,
  getWDIDFromIRI,
  type WikidataRestFetcher,
} from "@graviola/edb-wikidata-utils";
import type { FileCache } from "./cache";
import type { ProgressLogger } from "./types";
import { WIKIDATA_ENTITY_PREFIX } from "./types";

export type CachedEntityFetcher = {
  restFetcher: WikidataRestFetcher;
  getEntityByIRI: (iri: string) => Promise<unknown>;
  stats: () => { fetched: number; cached: number };
};

/** QIDs that terminate geographic P131 chains (not useful as places). */
const DEFAULT_STOP_QIDS = new Set([
  "Q2", // Earth
  "Q46", // Europe
  "Q48", // Asia
  "Q15", // Africa
  "Q18", // South America
  "Q49", // North America
  "Q538", // Oceania
  "Q5401", // Eurasia
]);

const API_ENDPOINT = "https://www.wikidata.org/w/api.php";
const USER_AGENT =
  "GraviolaSampleData/0.1 (https://github.com/gravio-la/graviola-framework; sample-data generator)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchJsonWithRetry = async (
  url: string,
  attempts = 4,
): Promise<unknown> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });
      const text = await res.text();
      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * 2 ** i);
        lastError = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        lastError = new Error(`Non-JSON response: ${text.slice(0, 200)}`);
        await sleep(500 * 2 ** i);
      }
    } catch (e) {
      lastError = e;
      await sleep(500 * 2 ** i);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

/**
 * Wraps Wikidata REST entityFetch with a per-QID JSON file cache.
 * Also exposes getEntityByIRI suitable for AuthorityConfiguration.
 */
export const createCachedEntityFetcher = (options: {
  cache: FileCache;
  progress?: ProgressLogger;
  stopQids?: Set<string>;
}): CachedEntityFetcher => {
  const { cache } = options;
  const stopQids = options.stopQids ?? DEFAULT_STOP_QIDS;
  let fetched = 0;
  let cached = 0;

  const restFetcher: WikidataRestFetcher = {
    searchFetch: async () => {
      throw new Error("searchFetch is not used by sample-data");
    },
    restSearchFetch: async () => {
      throw new Error("restSearchFetch is not used by sample-data");
    },
    entityFetch: async (entityParams) => {
      const ids = entityParams.get("ids") ?? "unknown";
      if (stopQids.has(ids)) {
        return { entities: { [ids]: null } };
      }
      const cacheKey = `entities/${ids}.json`;
      const hit = await cache.getJson<Record<string, unknown>>(cacheKey);
      if (hit) {
        cached += 1;
        return hit;
      }
      // Ensure required params; add origin for compatibility
      const params = new URLSearchParams(entityParams);
      if (!params.has("origin")) params.set("origin", "*");
      if (!params.has("format")) params.set("format", "json");
      if (!params.has("action")) params.set("action", "wbgetentities");

      const url = `${API_ENDPOINT}?${params.toString()}`;
      const result = await fetchJsonWithRetry(url);
      await cache.setJson(cacheKey, result);
      fetched += 1;
      // Be polite to the API when fetching many entities
      await sleep(50);
      return result;
    },
  };

  const getEntityByIRI = async (iri: string) => {
    const qid = getWDIDFromIRI(
      iri.startsWith(WIKIDATA_ENTITY_PREFIX)
        ? iri
        : `${WIKIDATA_ENTITY_PREFIX}${iri.replace(/^.*\//, "")}`,
    );
    if (stopQids.has(qid)) {
      return null;
    }
    const normalized = `${WIKIDATA_ENTITY_PREFIX}${qid}`;
    return getEntityFromWikidataByIRI(
      normalized,
      { rank: "preferred" },
      restFetcher,
    );
  };

  return {
    restFetcher,
    getEntityByIRI,
    stats: () => ({ fetched, cached }),
  };
};
