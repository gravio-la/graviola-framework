import type {
  FacetFilter,
  FullTextSearchAdapter,
  IndexDocument,
  IndexSettings,
  TextIndexQuery,
  TextIndexResult,
} from "@graviola/fulltext-search-core";
import { isFacetFilterRange } from "@graviola/fulltext-search-core";

export type MeilisearchConfig = {
  baseUrl: string;
  apiKey?: string;
  /** Default index uid when using legacy single-index helpers */
  index?: string;
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

function baseUrl(config: MeilisearchConfig): string {
  return config.baseUrl.replace(/\/$/, "");
}

async function meiliFetch(
  config: MeilisearchConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${baseUrl(config)}${path}`, {
    ...init,
    headers: {
      ...meiliHeaders(config.apiKey),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  return res;
}

async function parseTaskUid(res: Response): Promise<number | undefined> {
  if (res.status === 202 || res.ok) {
    try {
      const body = (await res.json()) as { taskUid?: number };
      return body.taskUid;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function waitForTask(
  config: MeilisearchConfig,
  taskUid: number,
  maxWaitMs = 30_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await meiliFetch(config, `/tasks/${taskUid}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meilisearch task ${taskUid}: ${res.status} ${text}`);
    }
    const task = (await res.json()) as { status: string; error?: unknown };
    if (task.status === "succeeded") return;
    if (task.status === "failed") {
      throw new Error(
        `Meilisearch task ${taskUid} failed: ${JSON.stringify(task.error)}`,
      );
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Meilisearch task ${taskUid} timed out`);
}

export function renderMeiliFilter(
  filters: FacetFilter[] | undefined,
): string | undefined {
  if (!filters?.length) return undefined;
  const parts = filters.map((f) => {
    if (isFacetFilterRange(f)) {
      const clauses: string[] = [];
      if (f.gte != null) clauses.push(`${f.field} >= ${f.gte}`);
      if (f.lte != null) clauses.push(`${f.field} <= ${f.lte}`);
      return clauses.join(" AND ");
    }
    const val =
      typeof f.value === "string"
        ? `"${f.value.replace(/"/g, '\\"')}"`
        : String(f.value);
    return `${f.field} = ${val}`;
  });
  return parts.filter(Boolean).join(" AND ");
}

function normalizeSearchResponse(
  body: Record<string, unknown>,
  q: string,
): TextIndexResult {
  const rawHits = (body.hits ?? []) as Record<string, unknown>[];
  return {
    hits: rawHits.map((hit) => ({
      id: String(hit.id ?? ""),
      document: hit,
    })),
    estimatedTotalHits:
      (body.estimatedTotalHits as number | undefined) ??
      (body.totalHits as number | undefined),
    facetDistribution: body.facetDistribution as
      | Record<string, Record<string, number>>
      | undefined,
    processingTimeMs: body.processingTimeMs as number | undefined,
    query: (body.query as string | undefined) ?? q,
  };
}

/**
 * Meilisearch implementation of {@link FullTextSearchAdapter}.
 */
export function createMeilisearchAdapter(
  config: MeilisearchConfig,
): FullTextSearchAdapter {
  return {
    engine: "meilisearch",

    async ensureIndex(uid, settings: IndexSettings) {
      let res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}`,
        {
          method: "GET",
        },
      );
      if (res.status === 404) {
        res = await meiliFetch(config, `/indexes`, {
          method: "POST",
          body: JSON.stringify({
            uid,
            primaryKey: settings.primaryKey ?? "id",
          }),
        });
        if (!res.ok && res.status !== 409) {
          const text = await res.text();
          throw new Error(
            `Meilisearch create index ${uid}: ${res.status} ${text}`,
          );
        }
        const taskUid = await parseTaskUid(res);
        if (taskUid != null) await waitForTask(config, taskUid);
      }

      const settingsBody: Record<string, unknown> = {
        searchableAttributes: settings.searchableAttributes,
        filterableAttributes: settings.filterableAttributes,
      };
      if (settings.sortableAttributes?.length) {
        settingsBody.sortableAttributes = settings.sortableAttributes;
      }

      res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}/settings`,
        {
          method: "PATCH",
          body: JSON.stringify(settingsBody),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Meilisearch settings ${uid}: ${res.status} ${text}`);
      }
      const taskUid = await parseTaskUid(res);
      if (taskUid != null) await waitForTask(config, taskUid);
    },

    async addDocuments(uid, docs: IndexDocument[]) {
      if (docs.length === 0) return;
      const res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}/documents`,
        {
          method: "POST",
          body: JSON.stringify(docs),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Meilisearch addDocuments ${uid}: ${res.status} ${text}`,
        );
      }
      const taskUid = await parseTaskUid(res);
      if (taskUid != null) await waitForTask(config, taskUid);
    },

    async search(uid, q: TextIndexQuery): Promise<TextIndexResult> {
      const body: Record<string, unknown> = {
        q: q.q,
        limit: q.limit,
      };
      if (q.offset != null && q.offset > 0) body.offset = q.offset;
      const filter = renderMeiliFilter(q.filters);
      if (filter) body.filter = filter;
      if (q.attributesToSearchOn?.length) {
        body.attributesToSearchOn = q.attributesToSearchOn;
      }
      if (q.facets?.length) body.facets = q.facets;

      const res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}/search`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Meilisearch search ${uid}: ${res.status} ${text}`);
      }
      const json = (await res.json()) as Record<string, unknown>;
      return normalizeSearchResponse(json, q.q);
    },

    async clearIndex(uid) {
      const res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}/documents`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) {
        const text = await res.text();
        throw new Error(`Meilisearch clearIndex ${uid}: ${res.status} ${text}`);
      }
      const taskUid = await parseTaskUid(res);
      if (taskUid != null) await waitForTask(config, taskUid);
    },

    async deleteIndex(uid) {
      const res = await meiliFetch(
        config,
        `/indexes/${encodeURIComponent(uid)}`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) {
        const text = await res.text();
        throw new Error(
          `Meilisearch deleteIndex ${uid}: ${res.status} ${text}`,
        );
      }
      const taskUid = await parseTaskUid(res);
      if (taskUid != null) await waitForTask(config, taskUid);
    },
  };
}

/** @deprecated Use createMeilisearchAdapter().search() via the composite store. */
export async function searchMeilisearch(
  config: MeilisearchConfig & { index: string },
  params: {
    q: string;
    limit: number;
    offset?: number;
    filter?: string;
    attributesToSearchOn?: string[];
    facets?: string[];
  },
): Promise<{
  hits: Record<string, unknown>[];
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query: string;
  facetDistribution?: Record<string, Record<string, number>>;
}> {
  const adapter = createMeilisearchAdapter(config);
  const filters = params.filter
    ? [{ field: "_legacy", value: params.filter } as FacetFilter]
    : undefined;

  // Legacy filter string passthrough — used only when filter is pre-rendered Meili syntax
  const body: Record<string, unknown> = {
    q: params.q,
    limit: params.limit,
  };
  if (params.offset != null && params.offset > 0) body.offset = params.offset;
  if (params.filter) body.filter = params.filter;
  if (params.attributesToSearchOn?.length) {
    body.attributesToSearchOn = params.attributesToSearchOn;
  }
  if (params.facets?.length) body.facets = params.facets;

  const res = await meiliFetch(
    config,
    `/indexes/${encodeURIComponent(config.index)}/search`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meilisearch ${res.status}: ${text || res.statusText}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  void adapter;
  void filters;
  return {
    hits: (json.hits ?? []) as Record<string, unknown>[],
    estimatedTotalHits: json.estimatedTotalHits as number | undefined,
    processingTimeMs: json.processingTimeMs as number | undefined,
    query: (json.query as string) ?? params.q,
    facetDistribution: json.facetDistribution as
      | Record<string, Record<string, number>>
      | undefined,
  };
}

export function buildMimeTypeFilter(mimeType: string): FacetFilter {
  return { field: "mimeType", value: mimeType.trim() };
}
