import { ResponseMimetype, WorkerResult } from "@graviola/async-oxigraph";
import {
  CRUDFunctions,
  SPARQLCRUDLogger,
  SparqlEndpoint,
} from "@graviola/edb-core-types";
import datasetFactory from "@rdfjs/dataset";
import N3 from "n3";
import { useCallback, useMemo } from "react";

import { useOxigraph } from "./useOxigraph";

type DoQuery = (
  query: string,
  mimeType?: ResponseMimetype,
) => Promise<WorkerResult>;
export const makeLocalWorkerCrudOptions: (
  doQuery: DoQuery,
) => (endpoint: SparqlEndpoint & SPARQLCRUDLogger) => CRUDFunctions = (
  doQuery: DoQuery,
) => {
  return ({ logger }) =>
    ({
      askFetch: async (query) => Boolean(await doQuery(query)),
      constructFetch: async (query) => {
        const result = await doQuery(query);

        let ds = datasetFactory.dataset();
        if (!result?.data) {
          if (result?.error) {
            logger?.error("Error returned from query", result);
          }
          return ds;
        }

        try {
          const parser = new N3.Parser();
          const quads = parser.parse(result.data);
          ds = datasetFactory.dataset(quads);
        } catch (e: any) {
          logger?.error("Error parsing the data", e);
          throw new Error("unable to parse the data" + e.message);
        }
        return ds;
      },
      updateFetch: async (query) => {
        const result = await doQuery(query);
        return result?.data;
      },
      selectFetch: async (query, options) => {
        const result = await doQuery(query);
        return options?.withHeaders
          ? result?.data
          : result?.data?.results?.bindings;
      },
    }) as CRUDFunctions;
};

export const useAsyncLocalWorkerCrudOptions: (
  endpoint: SparqlEndpoint,
) => CRUDFunctions = (endpoint) => {
  const { oxigraph } = useOxigraph();
  const doQuery = useCallback(
    async (query: string, mimeType?: ResponseMimetype) => {
      if (!oxigraph) {
        throw new Error("Oxigraph not initialized");
      }
      return (await oxigraph.ao.query(query, mimeType)) as WorkerResult;
    },
    [oxigraph],
  );
  return useMemo(
    () => makeLocalWorkerCrudOptions(doQuery)(endpoint),
    [doQuery, endpoint],
  );
};
