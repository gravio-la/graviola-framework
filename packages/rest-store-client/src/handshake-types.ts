/** MIME negotiation for ReadResult envelope (v1). */
export const GRAVIOLA_STORE_ENVELOPE_ACCEPT =
  "application/vnd.graviola-store.envelope+json";

export type GraviolaAuthMode = "none" | "bearer" | "apiKey";

export type GraviolaIriHandlingMode = "fullIRI" | "localId";

export type GraviolaPaginationMode = "offset" | "cursor";

export type GraviolaTypeCapabilities = {
  loads?: boolean;
  lists?: boolean;
  filters?: boolean;
  writes?: boolean;
  removes?: boolean;
  counts?: boolean;
  /** Present when label/token/fulltext search is supported */
  searches?: {
    mode: "substring" | "token" | "fulltext";
    ranked?: boolean;
    caseSensitive?: boolean;
    perFieldWeights?: boolean;
  };
};

export type GraviolaStoreHandshakeInner = {
  version: string;
  basePath: string;
  iriHandling: GraviolaIriHandlingMode[];
  auth: {
    modes: GraviolaAuthMode[];
    apiKeyHeader?: string;
  };
  pagination: {
    modes: GraviolaPaginationMode[];
    maxLimit?: number;
  };
  idempotency?: {
    supported: boolean;
    windowSeconds?: number;
  };
  envelope?: {
    supported: boolean;
  };
  resolves?: {
    supported: boolean;
  };
  types: Record<string, { capabilities: GraviolaTypeCapabilities }>;
  openapiUrl?: string;
};

export type GraviolaStoreHandshakeResponse = {
  graviolaStore: GraviolaStoreHandshakeInner;
};
