import type { AuthorityConfiguration } from "@graviola/edb-data-mapping";

import type { AcquisitionCache } from "./cache";
import { createMemoryCache } from "./cache";
import type { FetchProvenance, FetchResult } from "./envelope";
import {
  executeAdapter,
  executeEntityByIri,
  executeOverpass,
  executeRest,
  executeSparqlSelect,
  type ExecutorContext,
} from "./executors/core";
import type { FetchImpl } from "./net/httpFetch";
import {
  createRateLimiter,
  DEFAULT_HOST_POLICIES,
  type RateLimiter,
} from "./net/limiter";
import type {
  BindingScope,
  DataSource,
  EntityByIriSource,
  HostPolicy,
} from "./types";

export type AcquisitionRuntimeOptions = {
  cache?: AcquisitionCache;
  limiter?: RateLimiter;
  hostPolicies?: Record<string, HostPolicy>;
  fetchImpl?: FetchImpl;
  refresh?: boolean;
  offline?: boolean;
  onProvenance?: (p: FetchProvenance) => void;
};

export type AcquisitionRuntime = {
  fetch: (
    source: DataSource,
    scope?: Partial<BindingScope>,
    signal?: AbortSignal,
  ) => Promise<FetchResult>;
  streamSource: (
    source: DataSource,
    scope?: Partial<BindingScope>,
    signal?: AbortSignal,
  ) => AsyncGenerator<FetchResult>;
  cacheStats: () => ReturnType<AcquisitionCache["stats"]>;
  toAuthorityConfiguration: (
    source: EntityByIriSource,
  ) => AuthorityConfiguration;
};

export const createAcquisitionRuntime = (
  options: AcquisitionRuntimeOptions = {},
): AcquisitionRuntime => {
  const cache =
    options.cache ??
    createMemoryCache({
      refresh: options.refresh,
      offline: options.offline,
    });
  const limiter =
    options.limiter ??
    createRateLimiter({
      ...DEFAULT_HOST_POLICIES,
      ...(options.hostPolicies ?? {}),
    });
  const fetchImpl = options.fetchImpl ?? fetch;

  const ctxBase = (
    scope: BindingScope,
    signal?: AbortSignal,
  ): ExecutorContext => ({
    scope,
    cache,
    limiter,
    fetchImpl,
    signal,
    refresh: options.refresh,
    offline: options.offline,
    onProvenance: options.onProvenance,
  });

  const dispatch = async (
    source: DataSource,
    ctx: ExecutorContext,
  ): Promise<FetchResult> => {
    switch (source.kind) {
      case "rest":
        return executeRest(source, ctx);
      case "sparql-select":
        return executeSparqlSelect(source, ctx);
      case "entity-by-iri":
        return executeEntityByIri(source, ctx);
      case "adapter":
        return executeAdapter(source, ctx);
      case "overpass":
        return executeOverpass(source, ctx);
      default: {
        const _exhaustive: never = source;
        return _exhaustive;
      }
    }
  };

  const runtime: AcquisitionRuntime = {
    fetch: async (source, scopePartial = {}, signal) => {
      const scope: BindingScope = {
        input: scopePartial.input ?? {},
        document: scopePartial.document,
        row: scopePartial.row,
      };
      return dispatch(source, ctxBase(scope, signal));
    },

    streamSource: async function* (source, scopePartial = {}, signal) {
      // For paginated rest sources, executeRest already aggregates.
      // streamSource yields one result per logical fetch; for now a single yield.
      const result = await runtime.fetch(source, scopePartial, signal);
      yield result;
    },

    cacheStats: () => cache.stats(),

    toAuthorityConfiguration: (source) => ({
      authorityIRI: source.authorityIRI,
      getEntityByIRI: async (iri: string) => {
        const result = await runtime.fetch(source, { input: { iri } });
        if (!result.ok) {
          throw new Error(result.error.message);
        }
        return result.items[0];
      },
    }),
  };

  return runtime;
};
