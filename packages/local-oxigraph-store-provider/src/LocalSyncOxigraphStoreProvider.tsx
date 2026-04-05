import { RDFMimetype } from "@graviola/async-oxigraph";
import type { CRUDFunctions, SparqlEndpoint } from "@graviola/edb-core-types";
import { AbstractDatastore } from "@graviola/edb-global-types";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import { debounce } from "lodash-es";
import {
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import { bulkLoader, LoadableData } from "./bulkLoader";
import { dumpSyncStore } from "./dumpOxigraph";
import {
  createLocalStorageGraphBlobStorage,
  fullStorageKey,
  getPersistedTurtle,
  type LocalPersistenceOptions,
  setPersistedTurtle,
} from "./localGraphPersistence";
import { makeLocalWorkerCrudOptions } from "./localSyncOxigraph";
import { initSyncOxigraph } from "./useOxigraph";

export type LocalSyncOxigraphStoreProviderProps = {
  children: ReactNode;
  endpoint: SparqlEndpoint;
  defaultLimit: number;
  initialData?: LoadableData;
  loader?: ReactNode;
  localPersistence?: LocalPersistenceOptions;
};

export const LocalSyncOxigraphStoreProvider: FunctionComponent<
  LocalSyncOxigraphStoreProviderProps
> = ({
  children,
  endpoint,
  defaultLimit,
  initialData,
  loader,
  localPersistence,
}) => {
  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
    env: { publicBasePath },
  } = useAdbContext();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [bundle, setBundle] = useState<{
    dataStore: AbstractDatastore;
    crudOptions: CRUDFunctions;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let debouncedPersist: ReturnType<typeof debounce> | null = null;

    const run = async () => {
      const store = await initSyncOxigraph(publicBasePath);
      if (!store || cancelled) {
        return;
      }

      const storage = createLocalStorageGraphBlobStorage();
      const fullKey = localPersistence
        ? fullStorageKey(localPersistence.storageKey)
        : "";

      const innerCrud = makeLocalWorkerCrudOptions(store)(endpoint);
      let crudOptions: CRUDFunctions = innerCrud;

      if (localPersistence?.enabled) {
        const persist = () => {
          try {
            const turtle = dumpSyncStore(store);
            setPersistedTurtle(storage, fullKey, turtle);
          } catch (e) {
            console.error(e);
          }
        };
        debouncedPersist = debounce(persist, localPersistence.debounceMS);
        crudOptions = {
          ...innerCrud,
          updateFetch: async (query, options) => {
            const r = await innerCrud.updateFetch(query, options);
            debouncedPersist?.();
            return r;
          },
        };
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

      try {
        const shouldRestore =
          localPersistence?.enabled === true &&
          localPersistence.restoreOnLoad === true;
        if (shouldRestore) {
          const persisted = getPersistedTurtle(storage, fullKey);
          if (persisted) {
            await bulkLoader(store, {
              triples: persisted,
              mimetype: RDFMimetype.NQUADS,
            });
          } else if (initialData) {
            await bulkLoader(store, initialData);
          }
        } else if (initialData) {
          await bulkLoader(store, initialData);
        }
      } catch (error) {
        console.error(error);
      }

      if (!cancelled) {
        setBundle({ dataStore, crudOptions });
        setDataLoaded(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
      debouncedPersist?.flush();
      debouncedPersist?.cancel();
    };
  }, [
    publicBasePath,
    endpoint,
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    initialData,
    localPersistence,
    endpoint.defaultUpdateGraph,
  ]);

  return bundle ? (
    <CrudProviderContext.Provider
      value={{
        crudOptions: bundle.crudOptions,
        dataStore: bundle.dataStore,
        isReady: Boolean(bundle && dataLoaded),
      }}
    >
      {!loader || dataLoaded ? children : loader}
    </CrudProviderContext.Provider>
  ) : null;
};
