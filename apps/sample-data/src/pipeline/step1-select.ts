import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createDefaultWikidataSparqlFetcher,
  type WikidataSparqlFetcher,
} from "@graviola/edb-wikidata-utils";
import type { RDFSelectResult } from "@graviola/edb-core-types";
import type { FileCache } from "./cache";
import type { ProgressLogger, SampleDomain } from "./types";
import { WIKIDATA_ENTITY_PREFIX } from "./types";

export type SelectResult = {
  entityIris: string[];
  qids: string[];
  raw: RDFSelectResult;
  fromCache: boolean;
};

const applyLimit = (query: string, limit?: number): string => {
  if (limit === undefined) return query;
  if (/\bLIMIT\s+\d+/i.test(query)) {
    return query.replace(/\bLIMIT\s+\d+/i, `LIMIT ${limit}`);
  }
  return `${query.trimEnd()}\nLIMIT ${limit}\n`;
};

const extractEntityIris = (
  result: RDFSelectResult,
  entityVar: string,
): string[] => {
  const seen = new Set<string>();
  const iris: string[] = [];
  for (const binding of result.results.bindings) {
    const term = binding[entityVar];
    if (!term || term.type !== "uri") continue;
    if (seen.has(term.value)) continue;
    seen.add(term.value);
    iris.push(term.value);
  }
  return iris;
};

export const runStep1Select = async (options: {
  domain: SampleDomain;
  cache: FileCache;
  limit?: number;
  sparqlFetcher?: WikidataSparqlFetcher;
  progress: ProgressLogger;
}): Promise<SelectResult> => {
  const { domain, cache, progress } = options;
  const entityVar = domain.seed.entityVar ?? "city";
  const limit = options.limit ?? domain.seed.limit;
  const queryPath = join(domain.domainDir, domain.seed.query);
  const queryTemplate = await readFile(queryPath, "utf8");
  const query = applyLimit(queryTemplate, limit);
  const cacheKey = `select-${domain.name}-limit-${limit ?? "none"}.json`;

  const cached = await cache.getJson<RDFSelectResult>(cacheKey);
  if (cached) {
    const entityIris = extractEntityIris(cached, entityVar);
    progress.step(
      1,
      3,
      "SPARQL SELECT",
      `${entityIris.length} Q-IDs           (cache hit)`,
    );
    return {
      entityIris,
      qids: entityIris.map((iri) => iri.replace(WIKIDATA_ENTITY_PREFIX, "")),
      raw: cached,
      fromCache: true,
    };
  }

  const fetcher = options.sparqlFetcher ?? createDefaultWikidataSparqlFetcher();
  const raw = await fetcher.selectFetch(query);
  await cache.setJson(cacheKey, raw);
  const entityIris = extractEntityIris(raw, entityVar);
  progress.step(
    1,
    3,
    "SPARQL SELECT",
    `${entityIris.length} Q-IDs           (fetched)`,
  );
  return {
    entityIris,
    qids: entityIris.map((iri) => iri.replace(WIKIDATA_ENTITY_PREFIX, "")),
    raw,
    fromCache: false,
  };
};
