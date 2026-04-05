import {
  CRUDFunctions,
  SelectFetchOptions,
  SPARQLCRUDLogger,
  SPARQLQueryOptions,
  SPARQLQueryType,
} from "@graviola/edb-core-types";

import { peekSparqlAsyncQueryKey } from "./sparqAsyncQueryKey";

const makeTimerLabel = (
  queryKey: string | undefined,
  queryType: SPARQLQueryType,
) =>
  `${queryType}:${queryKey ?? ""}:${Math.random().toString(36).slice(2, 10)}`;

const effectiveQueryKey = (
  options: SPARQLQueryOptions | undefined,
): string | undefined => options?.queryKey ?? peekSparqlAsyncQueryKey();

const runLogged = async <T>(
  options: SPARQLQueryOptions | undefined,
  query: string,
  queryType: SPARQLQueryType,
  logger: SPARQLCRUDLogger["logger"],
  logQuery: SPARQLCRUDLogger["logQuery"],
  timerLabel: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const queryKey = effectiveQueryKey(options);
  logger?.time?.(timerLabel);
  const t0 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  let error: unknown;
  try {
    return await fn();
  } catch (e) {
    error = e;
    throw e;
  } finally {
    const t1 =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    logger?.timeEnd?.(timerLabel);
    logQuery?.(queryKey, query, queryType, {
      durationMs: t1 - t0,
      ...(error !== undefined ? { error } : {}),
    });
  }
};

export const sparqlLoggingWrapper: (
  endpoint: SPARQLCRUDLogger,
  crudFunctions: CRUDFunctions,
) => CRUDFunctions = ({ logger, logQuery }, crudFunctions) => ({
  askFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "ask";
    const timerLabel = makeTimerLabel(effectiveQueryKey(options), queryType);
    return runLogged(
      options,
      query,
      queryType,
      logger,
      logQuery,
      timerLabel,
      () => crudFunctions.askFetch(query, options),
    );
  },
  constructFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "construct";
    const timerLabel = makeTimerLabel(effectiveQueryKey(options), queryType);
    return runLogged(
      options,
      query,
      queryType,
      logger,
      logQuery,
      timerLabel,
      () => crudFunctions.constructFetch(query, options),
    );
  },
  updateFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "update";
    const timerLabel = makeTimerLabel(effectiveQueryKey(options), queryType);
    return runLogged(
      options,
      query,
      queryType,
      logger,
      logQuery,
      timerLabel,
      () => crudFunctions.updateFetch(query, options),
    );
  },
  selectFetch: (async (
    query: string,
    options?: SelectFetchOptions & SPARQLQueryOptions,
  ) => {
    const queryType = "select";
    const timerLabel = makeTimerLabel(effectiveQueryKey(options), queryType);
    return runLogged(
      options,
      query,
      queryType,
      logger,
      logQuery,
      timerLabel,
      () =>
        // selectFetch has incompatible overloads for the wrapper's single implementation
        (
          crudFunctions.selectFetch as (
            q: string,
            o?: SelectFetchOptions & SPARQLQueryOptions,
          ) => Promise<unknown>
        )(query, options),
    );
  }) as CRUDFunctions["selectFetch"],
});
