import type { AsyncOxigraph } from "@graviola/async-oxigraph";
import { RDFMimetype } from "@graviola/async-oxigraph";
import type {
  SPARQLCRUDLogger,
  SparqlEndpoint,
  SPARQLQueryOptions,
} from "@graviola/edb-core-types";
import { sparqlLoggingWrapper } from "@graviola/edb-core-utils";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import { initSPARQLStore } from "@graviola/sparql-db-impl";
import { debounce } from "lodash-es";
import {
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { clearAsyncOxigraphDataset } from "./clearAsyncOxigraph";
import { bulkLoader, LoadableData } from "./bulkLoader";
import { dumpAsyncOxigraph } from "./dumpOxigraph";
import { useAsyncLocalWorkerCrudOptions } from "./localAsyncOxigraph";
import {
  createLocalStorageGraphBlobStorage,
  fullStorageKey,
  getPersistedTurtle,
  type LocalPersistenceOptions,
  setPersistedTurtle,
} from "./localGraphPersistence";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { JSONSchema7 } from "json-schema";
import { useOxigraph } from "./useOxigraph";

export type LocalOxigraphStoreProviderProps = {
  children: ReactNode;
  endpoint: SparqlEndpoint & Partial<SPARQLCRUDLogger>;
  defaultLimit: number;
  initialData?: LoadableData;
  loader?: ReactNode;
  localPersistence?: LocalPersistenceOptions;
  /** When true, parent-side edits to `x-inverseOf` properties sync canonical forward triples (e.g. child.parentCategory). */
  enableInversePropertiesFeature?: boolean;
  /** Opt-in system-asserted entity `$meta` stamping on upsert. */
  metaStamping?: MetaStampingConfig;
  /**
   * Schema for store init (writes + persistence). Defaults to {@link useAdbContext} `schema`.
   * Use the domain schema when UI reads use a pre-grafted `displaySchema` so `$meta` survives
   * the cleanJSONLD round-trip (see initSPARQLStore persistence derivation).
   */
  storeSchema?: JSONSchema7;
};

export const LocalOxigraphStoreProvider: FunctionComponent<
  LocalOxigraphStoreProviderProps
> = ({
  children,
  endpoint,
  defaultLimit,
  initialData,
  loader,
  localPersistence,
  enableInversePropertiesFeature,
  metaStamping,
  storeSchema: storeSchemaOverride,
}) => {
  const { oxigraph } = useOxigraph();
  const baseCrud = useAsyncLocalWorkerCrudOptions(endpoint);
  const crudWithLogging = useMemo(() => {
    if (endpoint.logQuery || endpoint.logger) {
      return sparqlLoggingWrapper(endpoint, baseCrud);
    }
    return baseCrud;
  }, [endpoint, baseCrud]);

  const storage = useMemo(() => createLocalStorageGraphBlobStorage(), []);
  const oxigraphRef = useRef(oxigraph?.ao);
  oxigraphRef.current = oxigraph?.ao;

  const fullKey = useMemo(
    () => (localPersistence ? fullStorageKey(localPersistence.storageKey) : ""),
    [localPersistence],
  );

  const debouncedPersist = useMemo(() => {
    if (!localPersistence?.enabled) {
      return null;
    }
    return debounce(() => {
      void (async () => {
        const ao = oxigraphRef.current;
        if (!ao) {
          return;
        }
        try {
          const turtle = await dumpAsyncOxigraph(ao as AsyncOxigraph);
          setPersistedTurtle(storage, fullKey, turtle);
        } catch (e) {
          console.error(e);
        }
      })();
    }, localPersistence.debounceMS);
  }, [localPersistence, fullKey, storage]);

  useEffect(() => {
    return () => {
      debouncedPersist?.flush();
      debouncedPersist?.cancel();
    };
  }, [debouncedPersist]);

  const wrappedCrud = useMemo(() => {
    if (!localPersistence?.enabled || !debouncedPersist) {
      return crudWithLogging;
    }
    return {
      ...crudWithLogging,
      updateFetch: async (query: string, options?: SPARQLQueryOptions) => {
        const r = await crudWithLogging.updateFetch(query, options);
        debouncedPersist();
        return r;
      },
    };
  }, [crudWithLogging, localPersistence, debouncedPersist]);

  const {
    schema: contextSchema,
    typeNameToTypeIRI,
    queryBuildOptions,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();
  const schema = storeSchemaOverride ?? contextSchema;
  const [dataLoaded, setDataLoaded] = useState(false);

  const dataStore = useMemo(() => {
    const store = oxigraph?.ao;
    if (!store) {
      return null;
    }
    return initSPARQLStore({
      defaultPrefix,
      jsonldContext,
      typeNameToTypeIRI,
      queryBuildOptions,
      walkerOptions: {
        maxRecursion: 3,
        maxRecursionEachRef: 3,
        skipAtLevel: 10,
        omitEmptyArrays: true,
        omitEmptyObjects: true,
      },
      sparqlQueryFunctions: wrappedCrud,
      schema,
      defaultLimit,
      defaultUpdateGraph: endpoint.defaultUpdateGraph,
      enableInversePropertiesFeature,
      metaStamping,
    });
  }, [
    oxigraph?.ao,
    wrappedCrud,
    schema,
    typeNameToTypeIRI,
    queryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    endpoint.defaultUpdateGraph,
    enableInversePropertiesFeature,
    metaStamping,
  ]);

  useEffect(() => {
    const store = oxigraph?.ao;
    if (!store) {
      return;
    }

    setDataLoaded(false);
    let cancelled = false;
    (async () => {
      try {
        await clearAsyncOxigraphDataset(store as AsyncOxigraph);
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
            return;
          }
        }
        if (initialData) {
          await bulkLoader(store, initialData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setDataLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    oxigraph?.ao,
    initialData,
    localPersistence?.enabled,
    localPersistence?.restoreOnLoad,
    fullKey,
    storage,
  ]);

  return (
    <CrudProviderContext.Provider
      value={{
        crudOptions: wrappedCrud,
        dataStore,
        isReady: Boolean(dataStore && dataLoaded),
      }}
    >
      {!loader || dataLoaded ? children : loader}
    </CrudProviderContext.Provider>
  );
};
