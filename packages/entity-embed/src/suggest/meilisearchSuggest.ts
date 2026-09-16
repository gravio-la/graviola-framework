import type {
  EntitySuggestCandidate,
  EntitySuggestOptions,
  EntitySuggestProvider,
} from "../types";

export type MeilisearchSuggestConfig = {
  baseUrl: string;
  apiKey?: string;
  indexNameForType: (typeName: string) => string;
  typeNames: string[];
  typeNameToTypeIRI: (typeName: string) => string;
  labelFieldForType?: (typeName: string) => string;
};

type MeiliHit = {
  id?: string;
  "@id"?: string;
  [key: string]: unknown;
};

function meiliHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export function createMeilisearchEntitySuggestProvider(
  config: MeilisearchSuggestConfig,
): EntitySuggestProvider {
  const base = config.baseUrl.replace(/\/$/, "");

  return {
    async suggest(query, options?: EntitySuggestOptions) {
      const limit = options?.limit ?? 10;
      const typeNames = options?.typeNames ?? config.typeNames;
      const searches = typeNames.map((typeName) => ({
        indexUid: config.indexNameForType(typeName),
        q: query,
        limit: Math.ceil(limit / typeNames.length) + 1,
      }));

      const res = await fetch(`${base}/multi-search`, {
        method: "POST",
        headers: meiliHeaders(config.apiKey),
        body: JSON.stringify({ queries: searches }),
      });

      if (!res.ok) {
        return [];
      }

      const body = (await res.json()) as {
        results: Array<{ hits: MeiliHit[]; indexUid?: string }>;
      };

      const candidates: EntitySuggestCandidate[] = [];

      body.results.forEach((result, i) => {
        const typeName = typeNames[i] ?? "Unknown";
        const labelField = config.labelFieldForType?.(typeName) ?? "name";
        for (const hit of result.hits) {
          const entityIRI = String(hit["@id"] ?? hit.id ?? "");
          if (!entityIRI) continue;
          const label = String(
            hit[labelField] ??
              hit.title ??
              hit.name ??
              entityIRI.split("/").pop() ??
              entityIRI,
          );
          candidates.push({
            entityIRI,
            typeName,
            typeIRI: config.typeNameToTypeIRI(typeName),
            label,
          });
        }
      });

      return candidates.slice(0, limit);
    },
  };
}
