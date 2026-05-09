export { capabilityDescriptorFromHandshake } from "./descriptor-from-handshake";
export type {
  GraviolaAuthMode,
  GraviolaIriHandlingMode,
  GraviolaPaginationMode,
  GraviolaStoreHandshakeInner,
  GraviolaStoreHandshakeResponse,
  GraviolaTypeCapabilities,
} from "./handshake-types";
export { GRAVIOLA_STORE_ENVELOPE_ACCEPT } from "./handshake-types";

export {
  createRestTransport,
  defaultRestTransportRetry,
  type RestAuthConfig,
  type RestTransport,
  type RestTransportOptions,
} from "./shared/fetcher";
export type { RetryOptions as RestTransportRetryOptions } from "ky";
export {
  GraviolaRestError,
  type GraviolaProblemDetails,
  parseProblemDetailsBody,
  throwIfNotOk,
} from "./shared/errors";
export { newIdempotencyKey } from "./shared/idempotency";
export { fetchGraviolaStoreHandshake } from "./shared/handshake-fetch";
export { joinUrl } from "./shared/base-path";
export {
  createRESTClientStoreClient,
  type RESTClientStore,
  type RESTClientStoreOptions,
} from "./v1/RESTClientStore";
export {
  createLegacyRESTClientStore,
  type LegacyRESTClientStore,
  type LegacyRESTClientStoreOptions,
  type LegacyWireFindOptions,
} from "./v0/LegacyRESTClientStore";

export { abstractDatastoreFromRestStore } from "./shim/abstractDatastoreFromRestStore";

import type { Identifies } from "@graviola/store-core";
import type { SchemaRegistry } from "@graviola/store-core";

import type { GraviolaIriHandlingMode } from "./handshake-types";
import { createRestTransport, type RestAuthConfig } from "./shared/fetcher";
import { fetchGraviolaStoreHandshake } from "./shared/handshake-fetch";
import {
  createRESTClientStoreClient,
  type RESTClientStore,
} from "./v1/RESTClientStore";

/**
 * Fetch handshake then construct a v1 {@link RESTClientStore}.
 */
export const createRESTClientStore = async <
  R extends SchemaRegistry = SchemaRegistry,
>(options: {
  baseUrl: string;
  auth: RestAuthConfig;
  identifies: Identifies;
  iriHandling: GraviolaIriHandlingMode;
  localIdFromIri?: (iri: string) => string;
  handshakePath: string;
  fetchImpl?: typeof fetch;
}): Promise<RESTClientStore<R>> => {
  const transport = createRestTransport({
    baseUrl: options.baseUrl,
    auth: options.auth,
    fetchImpl: options.fetchImpl,
  });
  const handshake = await fetchGraviolaStoreHandshake(
    transport,
    options.handshakePath,
  );
  return createRESTClientStoreClient<R>({
    transport,
    handshake,
    identifies: options.identifies,
    iriHandling: options.iriHandling,
    localIdFromIri: options.localIdFromIri,
  });
};
