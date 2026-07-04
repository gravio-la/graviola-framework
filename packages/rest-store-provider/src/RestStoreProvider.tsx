import type { SparqlEndpoint } from "@graviola/edb-core-types";
import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import { createLegacyRESTClientStore } from "@graviola/rest-store-client";
import { type FunctionComponent, type ReactNode, useMemo } from "react";

export type RestStoreProviderProps = {
  children: ReactNode;
  endpoint: SparqlEndpoint;
  defaultLimit: number;
  requestOptions?: RequestInit;
  buildEndpointURL?: (
    operation: string,
    typeName: string,
    queryString?: string,
  ) => string;
};
export const RestStoreProvider: FunctionComponent<RestStoreProviderProps> = ({
  children,
  endpoint,
  defaultLimit: _unusedDefaultLimit,
  requestOptions,
  buildEndpointURL,
}) => {
  void _unusedDefaultLimit;
  const {
    typeNameToTypeIRI,
    jsonLDConfig: { defaultPrefix },
    queryBuildOptions: { primaryFields, primaryFieldExtracts },
  } = useAdbContext();
  const dataStore = useMemo(() => {
    return createLegacyRESTClientStore({
      apiURL: endpoint.endpoint,
      defaultPrefix,
      identifies: {
        typeNameToTypeIRI,
        typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
      },
      requestOptions,
      buildEndpointURL,
      primaryFields,
      primaryFieldExtracts,
    });
  }, [
    endpoint,
    defaultPrefix,
    typeNameToTypeIRI,
    requestOptions,
    buildEndpointURL,
    primaryFields,
    primaryFieldExtracts,
  ]);
  return (
    <CrudProviderContext.Provider
      value={{ crudOptions: null, dataStore, isReady: Boolean(dataStore) }}
    >
      {children}
    </CrudProviderContext.Provider>
  );
};
