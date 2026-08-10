import { getViaSourcePath } from "@graviola/edb-data-mapping";

import { resolveBinding, resolveParams, renderTemplate } from "../bind";
import type { FetchProvenance, FetchResult } from "../envelope";
import { hashRequest } from "../envelope";
import type { AcquisitionCache } from "../cache";
import { hostFromUrl, httpFetch, type FetchImpl } from "../net/httpFetch";
import type { RateLimiter } from "../net/limiter";
import type {
  AdapterSource,
  BindingScope,
  CachePolicy,
  DataSource,
  EntityByIriSource,
  OverpassSource,
  RestSource,
  SparqlSelectSource,
} from "../types";

export type ExecutorContext = {
  scope: BindingScope;
  cache: AcquisitionCache;
  limiter: RateLimiter;
  fetchImpl: FetchImpl;
  signal?: AbortSignal;
  refresh?: boolean;
  offline?: boolean;
  onProvenance?: (p: FetchProvenance) => void;
};

const cachePolicyOf = (source: DataSource): CachePolicy | undefined =>
  source.cache;

const shouldUseCache = (policy: CachePolicy | undefined): boolean =>
  !(policy && "disabled" in policy && policy.disabled);

const maxAgeOf = (policy: CachePolicy | undefined): number | undefined => {
  if (!policy || ("disabled" in policy && policy.disabled)) return undefined;
  return policy.maxAgeSeconds;
};

const cacheKeyOf = (source: DataSource, hash: string): string => {
  const policy = cachePolicyOf(source);
  const prefix =
    policy && !("disabled" in policy && policy.disabled)
      ? (policy.keyPrefix ?? source.id)
      : source.id;
  return `${prefix}/${hash}`;
};

const baseProvenance = (
  source: DataSource,
  endpoint: string,
  summary: string,
  hash: string,
  startedAt: number,
  extras: Partial<FetchProvenance> = {},
): FetchProvenance => ({
  sourceId: source.id,
  kind: source.kind,
  endpoint,
  request: { summary, hash, body: extras.request?.body },
  requestedAt: new Date(startedAt).toISOString(),
  durationMs: Date.now() - startedAt,
  cache: extras.cache ?? "miss",
  attempts: extras.attempts ?? 1,
  httpStatus: extras.httpStatus,
  pages: extras.pages,
  detail: extras.detail,
  license: source.license,
});

const projectItems = (
  raw: unknown,
  itemsPath?: string | string[],
): unknown[] => {
  if (!itemsPath) {
    if (Array.isArray(raw)) return raw;
    return [raw];
  }
  const projected = getViaSourcePath(raw, itemsPath);
  if (Array.isArray(projected)) return projected;
  if (projected == null) return [];
  return [projected];
};

export const executeRest = async (
  source: RestSource,
  ctx: ExecutorContext,
): Promise<FetchResult> => {
  const startedAt = Date.now();
  const params = resolveParams(source.params, ctx.scope);
  let url = renderTemplate(source.url, params);

  if (source.query) {
    const q = resolveParams(source.query, ctx.scope);
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v != null) usp.set(k, String(v));
    }
    const qs = usp.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const method = source.method ?? "GET";
  const headers: Record<string, string> = {};
  if (source.headers) {
    for (const [k, v] of Object.entries(source.headers)) {
      headers[k] =
        typeof v === "string" ? v : String(resolveBinding(v, ctx.scope) ?? "");
    }
  }
  const body =
    source.body != null
      ? String(resolveBinding(source.body, ctx.scope) ?? "")
      : undefined;

  const summary = `${method} ${url}`;
  const hash = await hashRequest(summary, body);
  const policy = cachePolicyOf(source);

  if (shouldUseCache(policy)) {
    const hit = await ctx.cache.get<unknown>(cacheKeyOf(source, hash), hash);
    if (hit) {
      const items = projectItems(hit.value, source.itemsPath);
      const provenance = baseProvenance(source, url, summary, hash, startedAt, {
        cache: hit.cache,
        attempts: 0,
      });
      ctx.onProvenance?.(provenance);
      return { ok: true, items, raw: hit.value, provenance };
    }
  }

  const host = source.hostPolicy ?? hostFromUrl(url);
  await ctx.limiter.acquire(host);

  const pagination = source.pagination;
  if (!pagination || pagination.kind === "none") {
    const res = await httpFetch(url, {
      method,
      headers,
      body,
      signal: ctx.signal,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) {
      const provenance = baseProvenance(source, url, summary, hash, startedAt, {
        cache: "miss",
        attempts: res.attempts,
        httpStatus: res.status,
      });
      ctx.onProvenance?.(provenance);
      return {
        ok: false,
        error: {
          message: `HTTP ${res.status}: ${res.text.slice(0, 200)}`,
          retryable: res.retryable,
        },
        provenance,
      };
    }

    let raw: unknown;
    const format = source.responseFormat ?? "json";
    if (format === "text") {
      raw = res.text;
    } else if (format === "yaml") {
      const yaml = await import("yaml").catch(() => null);
      if (!yaml) {
        throw new Error(
          "yaml package required for responseFormat: yaml — add dependency",
        );
      }
      raw = yaml.parse(res.text);
    } else {
      raw = JSON.parse(res.text);
    }

    if (shouldUseCache(policy)) {
      await ctx.cache.set(
        cacheKeyOf(source, hash),
        hash,
        raw,
        maxAgeOf(policy),
      );
    }

    const items = projectItems(raw, source.itemsPath);
    const provenance = baseProvenance(source, url, summary, hash, startedAt, {
      cache: shouldUseCache(policy) ? "miss" : "disabled",
      attempts: res.attempts,
      httpStatus: res.status,
      pages: 1,
    });
    ctx.onProvenance?.(provenance);
    return { ok: true, items, raw, provenance };
  }

  // Pagination: next-link / page-number / offset
  const allItems: unknown[] = [];
  let pages = 0;
  let currentUrl = url;
  let attempts = 0;
  let lastRaw: unknown = null;
  const maxPages =
    pagination.kind === "next-link" ||
    pagination.kind === "page-number" ||
    pagination.kind === "offset"
      ? (pagination.maxPages ?? 100)
      : 100;

  if (pagination.kind === "next-link") {
    let next: string | null = currentUrl;
    while (next && pages < maxPages) {
      await ctx.limiter.acquire(source.hostPolicy ?? hostFromUrl(next));
      const res = await httpFetch(next, {
        method,
        headers,
        signal: ctx.signal,
        fetchImpl: ctx.fetchImpl,
      });
      attempts += res.attempts;
      if (!res.ok) {
        const provenance = baseProvenance(
          source,
          next,
          summary,
          hash,
          startedAt,
          {
            cache: "miss",
            attempts,
            httpStatus: res.status,
            pages,
          },
        );
        ctx.onProvenance?.(provenance);
        return {
          ok: false,
          error: {
            message: `HTTP ${res.status} on page ${pages + 1}`,
            retryable: res.retryable,
          },
          provenance,
        };
      }
      const raw = JSON.parse(res.text);
      lastRaw = raw;
      allItems.push(...projectItems(raw, source.itemsPath));
      pages += 1;
      const link = getViaSourcePath(raw, pagination.path);
      next = Array.isArray(link) ? link[0] : link;
      if (!next || typeof next !== "string") next = null;
    }
  } else if (pagination.kind === "page-number") {
    let page = pagination.startAt ?? 1;
    while (pages < maxPages) {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set(pagination.pageParam, String(page));
      if (pagination.sizeParam && pagination.size != null) {
        pageUrl.searchParams.set(pagination.sizeParam, String(pagination.size));
      }
      await ctx.limiter.acquire(
        source.hostPolicy ?? hostFromUrl(pageUrl.toString()),
      );
      const res = await httpFetch(pageUrl.toString(), {
        method,
        headers,
        signal: ctx.signal,
        fetchImpl: ctx.fetchImpl,
      });
      attempts += res.attempts;
      if (!res.ok) break;
      const raw = JSON.parse(res.text);
      lastRaw = raw;
      const batch = projectItems(raw, source.itemsPath);
      if (batch.length === 0) break;
      allItems.push(...batch);
      pages += 1;
      page += 1;
      if (pagination.size && batch.length < pagination.size) break;
    }
  } else if (pagination.kind === "offset") {
    let offset = 0;
    while (pages < maxPages) {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set(pagination.offsetParam, String(offset));
      pageUrl.searchParams.set(pagination.limitParam, String(pagination.limit));
      await ctx.limiter.acquire(
        source.hostPolicy ?? hostFromUrl(pageUrl.toString()),
      );
      const res = await httpFetch(pageUrl.toString(), {
        method,
        headers,
        signal: ctx.signal,
        fetchImpl: ctx.fetchImpl,
      });
      attempts += res.attempts;
      if (!res.ok) break;
      const raw = JSON.parse(res.text);
      lastRaw = raw;
      const batch = projectItems(raw, source.itemsPath);
      if (batch.length === 0) break;
      allItems.push(...batch);
      pages += 1;
      offset += pagination.limit;
      if (batch.length < pagination.limit) break;
    }
  }

  const raw = { items: allItems, lastPage: lastRaw };
  if (shouldUseCache(policy)) {
    await ctx.cache.set(cacheKeyOf(source, hash), hash, raw, maxAgeOf(policy));
  }
  const provenance = baseProvenance(source, url, summary, hash, startedAt, {
    cache: shouldUseCache(policy) ? "miss" : "disabled",
    attempts,
    pages,
  });
  ctx.onProvenance?.(provenance);
  return { ok: true, items: allItems, raw, provenance };
};

export const executeSparqlSelect = async (
  source: SparqlSelectSource,
  ctx: ExecutorContext,
): Promise<FetchResult> => {
  const startedAt = Date.now();
  const params = resolveParams(source.params, ctx.scope);
  let query = renderTemplate(source.query, params);
  const endpoint =
    typeof source.endpoint === "string"
      ? source.endpoint
      : String(resolveBinding(source.endpoint, ctx.scope));

  if (source.limit != null) {
    const limit =
      typeof source.limit === "number"
        ? source.limit
        : Number(resolveBinding(source.limit, ctx.scope));
    if (!query.includes("LIMIT") && Number.isFinite(limit)) {
      query = `${query.trim()}\nLIMIT ${limit}`;
    }
  }

  const summary = `SPARQL ${endpoint} ${query.slice(0, 120)}`;
  const hash = await hashRequest(summary, query);
  const policy = cachePolicyOf(source);

  if (shouldUseCache(policy)) {
    const hit = await ctx.cache.get<{
      bindings: unknown[];
      raw: unknown;
    }>(cacheKeyOf(source, hash), hash);
    if (hit) {
      const provenance = baseProvenance(
        source,
        endpoint,
        summary,
        hash,
        startedAt,
        { cache: hit.cache, attempts: 0 },
      );
      ctx.onProvenance?.(provenance);
      return {
        ok: true,
        items: hit.value.bindings,
        raw: hit.value.raw,
        provenance,
      };
    }
  }

  await ctx.limiter.acquire(source.hostPolicy ?? hostFromUrl(endpoint));
  const res = await httpFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
    },
    body: query,
    signal: ctx.signal,
    fetchImpl: ctx.fetchImpl,
  });

  if (!res.ok) {
    const provenance = baseProvenance(
      source,
      endpoint,
      summary,
      hash,
      startedAt,
      {
        cache: "miss",
        attempts: res.attempts,
        httpStatus: res.status,
        request: { summary, hash, body: query },
      },
    );
    ctx.onProvenance?.(provenance);
    return {
      ok: false,
      error: {
        message: `SPARQL HTTP ${res.status}`,
        retryable: res.retryable,
      },
      provenance,
    };
  }

  const raw = JSON.parse(res.text);
  const bindings: unknown[] = raw?.results?.bindings ?? [];
  if (shouldUseCache(policy)) {
    await ctx.cache.set(
      cacheKeyOf(source, hash),
      hash,
      { bindings, raw },
      maxAgeOf(policy),
    );
  }
  const provenance = baseProvenance(
    source,
    endpoint,
    summary,
    hash,
    startedAt,
    {
      cache: shouldUseCache(policy) ? "miss" : "disabled",
      attempts: res.attempts,
      httpStatus: res.status,
      request: { summary, hash, body: query },
    },
  );
  ctx.onProvenance?.(provenance);
  return { ok: true, items: bindings, raw, provenance };
};

export const executeEntityByIri = async (
  source: EntityByIriSource,
  ctx: ExecutorContext,
): Promise<FetchResult> => {
  const startedAt = Date.now();
  const iri = String(ctx.scope.input.iri ?? ctx.scope.input.entityIRI ?? "");
  const params: Record<string, string> = {};
  if (source.idFrom) {
    for (const { pattern, as } of source.idFrom) {
      const m = iri.match(new RegExp(pattern));
      if (m?.[1]) params[as] = m[1];
    }
  }
  const url = renderTemplate(source.url, params);
  const summary = `GET ${url}`;
  const hash = await hashRequest(summary);
  const policy = cachePolicyOf(source);

  if (shouldUseCache(policy)) {
    const hit = await ctx.cache.get<unknown>(cacheKeyOf(source, hash), hash);
    if (hit) {
      const doc = source.documentPath
        ? getViaSourcePath(hit.value, source.documentPath)
        : hit.value;
      const provenance = baseProvenance(source, url, summary, hash, startedAt, {
        cache: hit.cache,
        attempts: 0,
      });
      ctx.onProvenance?.(provenance);
      return { ok: true, items: [doc], raw: hit.value, provenance };
    }
  }

  await ctx.limiter.acquire(source.hostPolicy ?? hostFromUrl(url));
  const res = await httpFetch(url, {
    headers: source.headers,
    signal: ctx.signal,
    fetchImpl: ctx.fetchImpl,
  });
  if (!res.ok) {
    const provenance = baseProvenance(source, url, summary, hash, startedAt, {
      cache: "miss",
      attempts: res.attempts,
      httpStatus: res.status,
    });
    ctx.onProvenance?.(provenance);
    return {
      ok: false,
      error: {
        message: `HTTP ${res.status}`,
        retryable: res.retryable,
      },
      provenance,
    };
  }
  const raw = JSON.parse(res.text);
  if (shouldUseCache(policy)) {
    await ctx.cache.set(cacheKeyOf(source, hash), hash, raw, maxAgeOf(policy));
  }
  const doc = source.documentPath
    ? getViaSourcePath(raw, source.documentPath)
    : raw;
  const provenance = baseProvenance(source, url, summary, hash, startedAt, {
    cache: shouldUseCache(policy) ? "miss" : "disabled",
    attempts: res.attempts,
    httpStatus: res.status,
  });
  ctx.onProvenance?.(provenance);
  return { ok: true, items: [doc], raw, provenance };
};

export const executeAdapter = async (
  source: AdapterSource,
  ctx: ExecutorContext,
): Promise<FetchResult> => {
  const startedAt = Date.now();
  const summary = `adapter:${source.id}`;
  const hash = await hashRequest(summary);
  try {
    const { items, raw } = await source.fetch(ctx.scope, ctx.signal);
    const provenance = baseProvenance(
      source,
      source.authorityIRI ?? "adapter",
      summary,
      hash,
      startedAt,
      { cache: "disabled", attempts: 1 },
    );
    ctx.onProvenance?.(provenance);
    return { ok: true, items, raw: raw ?? items, provenance };
  } catch (err) {
    const provenance = baseProvenance(
      source,
      source.authorityIRI ?? "adapter",
      summary,
      hash,
      startedAt,
      { cache: "disabled", attempts: 1 },
    );
    ctx.onProvenance?.(provenance);
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : String(err),
        retryable: false,
        cause: err,
      },
      provenance,
    };
  }
};

export const executeOverpass = async (
  source: OverpassSource,
  ctx: ExecutorContext,
): Promise<FetchResult> => {
  const startedAt = Date.now();
  const params = resolveParams(source.params, ctx.scope);
  let query = renderTemplate(source.query, params);
  const summary = `Overpass ${query.slice(0, 120)}`;
  const hash = await hashRequest(summary, query);
  const policy = cachePolicyOf(source);

  if (shouldUseCache(policy)) {
    const hit = await ctx.cache.get<{
      elements: unknown[];
      raw: unknown;
    }>(cacheKeyOf(source, hash), hash);
    if (hit) {
      const provenance = baseProvenance(
        source,
        source.endpoints[0] ?? "overpass",
        summary,
        hash,
        startedAt,
        { cache: hit.cache, attempts: 0 },
      );
      ctx.onProvenance?.(provenance);
      return {
        ok: true,
        items: hit.value.elements,
        raw: hit.value.raw,
        provenance,
      };
    }
  }

  let lastError = "";
  let attempts = 0;
  let usedEndpoint = source.endpoints[0] ?? "";
  let fallbackUsed = false;

  const tryQuery = async (
    q: string,
    endpoints: string[],
  ): Promise<{ ok: true; raw: unknown; endpoint: string } | { ok: false }> => {
    for (const ep of endpoints) {
      usedEndpoint = ep;
      await ctx.limiter.acquire(source.hostPolicy ?? hostFromUrl(ep));
      const res = await httpFetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(q)}`,
        signal: ctx.signal,
        fetchImpl: ctx.fetchImpl,
        attempts: 2,
      });
      attempts += res.attempts;
      if (res.ok) {
        try {
          const raw = JSON.parse(res.text);
          if (
            typeof raw === "object" &&
            raw &&
            "remark" in raw &&
            String((raw as { remark?: string }).remark).includes("rate_limited")
          ) {
            lastError = "rate_limited";
            continue;
          }
          return { ok: true, raw, endpoint: ep };
        } catch {
          lastError = "invalid json";
          continue;
        }
      }
      lastError = `HTTP ${res.status}`;
      if (res.text.includes("rate_limited")) continue;
    }
    return { ok: false };
  };

  let result = await tryQuery(query, source.endpoints);
  const primaryEmpty =
    result.ok &&
    Array.isArray((result.raw as { elements?: unknown[] }).elements) &&
    (result.raw as { elements: unknown[] }).elements.length === 0;
  if (primaryEmpty && source.fallback?.kind === "bbox") {
    const boundsQ = renderTemplate(source.fallback.boundsQuery, params);
    const boundsRes = await tryQuery(boundsQ, source.endpoints);
    if (boundsRes.ok) {
      const el0 = (
        boundsRes.raw as {
          elements?: Array<{
            bounds?: {
              minlat: number;
              minlon: number;
              maxlat: number;
              maxlon: number;
            };
          }>;
        }
      ).elements?.[0];
      const b = el0?.bounds;
      if (b) {
        const fbQuery = renderTemplate(source.fallback.query, {
          ...params,
          south: b.minlat,
          west: b.minlon,
          north: b.maxlat,
          east: b.maxlon,
        });
        result = await tryQuery(fbQuery, source.endpoints);
        fallbackUsed = true;
        query = fbQuery;
      }
    }
  }

  if (!result.ok) {
    const provenance = baseProvenance(
      source,
      usedEndpoint,
      summary,
      hash,
      startedAt,
      {
        cache: "miss",
        attempts,
        detail: { lastError, fallbackUsed },
        request: { summary, hash, body: query },
      },
    );
    ctx.onProvenance?.(provenance);
    return {
      ok: false,
      error: { message: lastError || "overpass failed", retryable: true },
      provenance,
    };
  }

  const elements = (result.raw as { elements?: unknown[] }).elements ?? [];
  if (shouldUseCache(policy)) {
    await ctx.cache.set(
      cacheKeyOf(source, hash),
      hash,
      { elements, raw: result.raw },
      maxAgeOf(policy),
    );
  }
  const provenance = baseProvenance(
    source,
    result.endpoint,
    summary,
    hash,
    startedAt,
    {
      cache: shouldUseCache(policy) ? "miss" : "disabled",
      attempts,
      detail: { fallbackUsed },
      request: { summary, hash, body: query },
    },
  );
  ctx.onProvenance?.(provenance);
  return { ok: true, items: elements, raw: result.raw, provenance };
};
