import type {
  SPARQLCRUDLogger,
  SparqlEndpoint,
} from "@graviola/edb-core-types";
import { sparqlLoggingWrapper } from "@graviola/edb-core-utils";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import {
  type FunctionComponent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import { useAsyncLocalWorkerCrudOptions } from "./localAsyncOxigraph";
import { useOxigraph } from "./useOxigraph";
import { bulkLoader, LoadableData } from "./bulkLoader";

export type LocalOxigraphStoreProviderProps = {
  children: ReactNode;
  endpoint: SparqlEndpoint & Partial<SPARQLCRUDLogger>;
  defaultLimit: number;
  initialData?: LoadableData;
  loader?: ReactNode;
};

export const LocalOxigraphStoreProvider: FunctionComponent<
  LocalOxigraphStoreProviderProps
> = ({ children, endpoint, defaultLimit, initialData, loader }) => {
  const { oxigraph } = useOxigraph();
  const baseCrud = useAsyncLocalWorkerCrudOptions(endpoint);
  const crudOptions = useMemo(() => {
    if (endpoint.logQuery || endpoint.logger) {
      return sparqlLoggingWrapper(endpoint, baseCrud);
    }
    return baseCrud;
  }, [endpoint, baseCrud]);
  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();
  const [dataLoaded, setDataLoaded] = useState(false);

  const dataStore = useMemo(() => {
    const store = oxigraph?.ao;
    if (!store) {
      return null;
    }
    const dataStore = initSPARQLStore({
      defaultPrefix,
      jsonldContext,
      typeNameToTypeIRI,
      queryBuildOptions,
      walkerOptions: {
        maxRecursion: 1,
        maxRecursionEachRef: 3,
        skipAtLevel: 10,
      },
      sparqlQueryFunctions: crudOptions,
      schema,
      defaultLimit,
      defaultUpdateGraph: endpoint.defaultUpdateGraph,
    });

    if (initialData && !dataLoaded) {
      bulkLoader(store, initialData)
        .then(() => {
          setDataLoaded(true);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setDataLoaded(true);
        });
    } else {
      setDataLoaded(true);
    }

    return dataStore;
  }, [
    oxigraph?.ao,
    crudOptions,
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    initialData,
    setDataLoaded,
    endpoint.defaultUpdateGraph,
  ]);

  return (
    <CrudProviderContext.Provider
      value={{
        crudOptions,
        dataStore,
        isReady: Boolean(dataStore && dataLoaded),
      }}
    >
      {!loader || dataLoaded ? children : loader}
    </CrudProviderContext.Provider>
  );
};
