import type {
  CRUDFunctions,
  SPARQLCRUDLogger,
  SparqlEndpoint,
  WalkerOptions,
} from "@graviola/edb-core-types";
import { sparqlLoggingWrapper } from "@graviola/edb-core-utils";
import {
  CrudProviderContext,
  resolveStoreQueryBuildOptions,
  useAdbContext,
} from "@graviola/edb-state-hooks";
import {
  initSPARQLStore,
  type SPARQLDataStoreConfig,
} from "@graviola/sparql-db-impl";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { JSONSchema7 } from "json-schema";
import { type FunctionComponent, type ReactNode, useMemo } from "react";

import { tripleStoreImplementations } from "./tripleStoreImplementations";

export type SparqlStoreProviderProps = {
  children: ReactNode;
  endpoint: SparqlEndpoint & Partial<SPARQLCRUDLogger>;
  defaultLimit: number;
  walkerOptions?: Partial<WalkerOptions>;
  enableInversePropertiesFeature?: boolean;
  /** Opt-in system-asserted entity `$meta` stamping on upsert. */
  metaStamping?: MetaStampingConfig;
  /**
   * Schema for store init (writes + persistence). Defaults to {@link useAdbContext} `schema`.
   */
  storeSchema?: JSONSchema7;
  /** Defaults merged into every `loadOne` / CONSTRUCT hydration (e.g. `maxRecursion`). */
  defaultLoadOptions?: SPARQLDataStoreConfig["defaultLoadOptions"];
  /** Defaults for typed-filter queries, merged under per-call options. */
  defaultFilterOptions?: SPARQLDataStoreConfig["defaultFilterOptions"];
};
export const SparqlStoreProvider: FunctionComponent<
  SparqlStoreProviderProps
> = ({
  children,
  endpoint,
  defaultLimit,
  walkerOptions,
  enableInversePropertiesFeature,
  metaStamping,
  storeSchema: storeSchemaOverride,
  defaultLoadOptions,
  defaultFilterOptions,
}) => {
  const rawCrud = useMemo<CRUDFunctions | null>(() => {
    return tripleStoreImplementations[endpoint.provider](endpoint);
  }, [endpoint]);

  const crudOptions = useMemo<CRUDFunctions | null>(() => {
    if (!rawCrud) return null;
    if (endpoint.logQuery || endpoint.logger) {
      return sparqlLoggingWrapper(endpoint, rawCrud);
    }
    return rawCrud;
  }, [endpoint, rawCrud]);

  const {
    schema: contextSchema,
    typeNameToTypeIRI,
    queryBuildOptions,
    inverses,
    jsonLDConfig: { defaultPrefix, jsonldContext },
    makeStubSchema,
  } = useAdbContext();
  const schema = storeSchemaOverride ?? contextSchema;
  const storeQueryBuildOptions = useMemo(
    () => resolveStoreQueryBuildOptions(queryBuildOptions, inverses),
    [queryBuildOptions, inverses],
  );

  const dataStore = useMemo(() => {
    return initSPARQLStore({
      defaultPrefix,
      jsonldContext,
      typeNameToTypeIRI,
      queryBuildOptions: storeQueryBuildOptions,
      walkerOptions: walkerOptions || {},
      sparqlQueryFunctions: crudOptions,
      schema,
      defaultLimit,
      makeStubSchema,
      enableInversePropertiesFeature,
      defaultUpdateGraph: endpoint.defaultUpdateGraph,
      metaStamping,
      defaultLoadOptions,
      defaultFilterOptions,
    });
  }, [
    crudOptions,
    schema,
    typeNameToTypeIRI,
    storeQueryBuildOptions,
    defaultPrefix,
    jsonldContext,
    defaultLimit,
    walkerOptions,
    endpoint.defaultUpdateGraph,
    makeStubSchema,
    enableInversePropertiesFeature,
    metaStamping,
    defaultLoadOptions,
    defaultFilterOptions,
  ]);

  return (
    <CrudProviderContext.Provider
      value={{ crudOptions, dataStore, isReady: Boolean(dataStore) }}
    >
      {children}
    </CrudProviderContext.Provider>
  );
};
