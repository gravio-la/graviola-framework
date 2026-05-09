import type { StringToIRIFn } from "@graviola/edb-core-types";
import type {
  AbstractDatastore,
  DatastoreBaseConfig,
  InitDatastoreFunction,
} from "@graviola/edb-global-types";
import {
  createLegacyRESTClientStore,
  abstractDatastoreFromRestStore,
  createRESTClientStore,
} from "@graviola/rest-store-client";

export type RestfullDataStoreConfig = {
  apiURL: string;
  defaultPrefix: string;
  typeNameToTypeIRI: StringToIRIFn;
  defaultLimit?: number;
  requestOptions?: RequestInit;
  buildEndpointURL?: (
    operation: string,
    typeName: string,
    queryString?: string,
  ) => string;
} & DatastoreBaseConfig;

export {
  createLegacyRESTClientStore,
  createRESTClientStore,
  abstractDatastoreFromRestStore,
};

export const initRestfullStore: InitDatastoreFunction<
  RestfullDataStoreConfig
> = (dataStoreConfig) => {
  const {
    apiURL,
    defaultPrefix,
    typeNameToTypeIRI,
    requestOptions,
    buildEndpointURL,
  } = dataStoreConfig;
  const identifies = {
    typeNameToTypeIRI,
    typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
  };
  const store = createLegacyRESTClientStore({
    apiURL,
    defaultPrefix,
    identifies,
    requestOptions,
    buildEndpointURL,
  });
  return abstractDatastoreFromRestStore(store) as AbstractDatastore;
};
