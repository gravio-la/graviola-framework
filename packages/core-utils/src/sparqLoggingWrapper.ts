import {
  CRUDFunctions,
  SelectFetchOptions,
  SPARQLCRUDLogger,
  SPARQLQueryOptions,
  SPARQLQueryType,
} from "@graviola/edb-core-types";

const makeTimerLabel = (
  queryKey: string | undefined,
  queryType: SPARQLQueryType,
) =>
  `${queryType}:${queryKey ?? ""}:${Math.random().toString(36).slice(2, 10)}`;

export const sparqlLoggingWrapper: (
  endpoint: SPARQLCRUDLogger,
  crudFunctions: CRUDFunctions,
) => CRUDFunctions = ({ logger, logQuery }, crudFunctions) => ({
  askFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "ask";
    const timerLabel = makeTimerLabel(options?.queryKey, queryType);
    logger?.time?.(timerLabel);
    logQuery?.(options?.queryKey, query, queryType);
    const result = await crudFunctions.askFetch(query, options);
    logger?.timeEnd?.(timerLabel);
    return result;
  },
  constructFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "construct";
    const timerLabel = makeTimerLabel(options?.queryKey, queryType);
    logger?.time?.(timerLabel);
    logQuery?.(options?.queryKey, query, queryType);
    const result = await crudFunctions.constructFetch(query, options);
    logger?.timeEnd?.(timerLabel);
    return result;
  },
  updateFetch: async (query: string, options?: SPARQLQueryOptions) => {
    const queryType = "update";
    const timerLabel = makeTimerLabel(options?.queryKey, queryType);
    logger?.time?.(timerLabel);
    logQuery?.(options?.queryKey, query, queryType);
    const result = await crudFunctions.updateFetch(query, options);
    logger?.timeEnd?.(timerLabel);
    return result;
  },
  selectFetch: async (
    query: string,
    options?: SelectFetchOptions & SPARQLQueryOptions,
  ) => {
    const queryType = "select";
    const timerLabel = makeTimerLabel(options?.queryKey, queryType);
    logger?.time?.(timerLabel);
    logQuery?.(options?.queryKey, query, queryType);
    // @ts-ignore
    const result = await crudFunctions.selectFetch(query, options);
    logger?.timeEnd?.(timerLabel);
    return result;
  },
});
