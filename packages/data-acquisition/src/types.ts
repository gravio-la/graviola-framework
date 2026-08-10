import type { JSONSchema7 } from "json-schema";

export type CachePolicy =
  | { disabled: true }
  | {
      disabled?: false;
      maxAgeSeconds?: number;
      /** Namespace under the cache root; defaults to source id. */
      keyPrefix?: string;
    };

export type BindingScope = {
  input: Record<string, unknown>;
  document?: unknown;
  row?: Record<string, unknown>;
};

export type ParamBinding =
  | { kind: "const"; value: unknown }
  | {
      kind: "path";
      from: "input" | "document" | "row";
      /** `$…` = JSONPath, otherwise lodash path — identical to mapByConfig's source.path */
      path: string | string[];
      take?: "first" | "all";
      default?: unknown;
      required?: boolean;
    }
  | {
      kind: "template";
      template: string;
      params: Record<string, ParamBinding>;
    };

export type DataSourceBase = {
  id: string;
  label?: string;
  hostPolicy?: string;
  cache?: CachePolicy;
  record?: "never" | "on-error" | "always";
  license?: string;
};

export type SparqlSelectSource = DataSourceBase & {
  kind: "sparql-select";
  endpoint: string | ParamBinding;
  query: string;
  params?: Record<string, ParamBinding>;
  entityVar?: string;
  limit?: number | ParamBinding;
};

export type OverpassSource = DataSourceBase & {
  kind: "overpass";
  endpoints: string[];
  query: string;
  params?: Record<string, ParamBinding>;
  timeoutMs?: number;
  fallback?: { kind: "bbox"; boundsQuery: string; query: string };
};

export type PaginationSpec =
  | { kind: "none" }
  | { kind: "next-link"; path: string | string[]; maxPages?: number }
  | {
      kind: "page-number";
      pageParam: string;
      startAt?: number;
      sizeParam?: string;
      size?: number;
      maxPages?: number;
    }
  | {
      kind: "offset";
      offsetParam: string;
      limitParam: string;
      limit: number;
      maxPages?: number;
    };

export type RestSource = DataSourceBase & {
  kind: "rest";
  method?: "GET" | "POST";
  url: string;
  params?: Record<string, ParamBinding>;
  query?: Record<string, ParamBinding>;
  headers?: Record<string, string | ParamBinding>;
  body?: ParamBinding;
  itemsPath?: string | string[];
  pagination?: PaginationSpec;
  responseFormat?: "json" | "yaml" | "text";
};

export type EntityByIriSource = DataSourceBase & {
  kind: "entity-by-iri";
  authorityIRI: string;
  url: string;
  idFrom?: Array<{ pattern: string; as: string }>;
  documentPath?: string;
  headers?: Record<string, string>;
};

export type AdapterSource = DataSourceBase & {
  kind: "adapter";
  authorityIRI?: string;
  fetch: (
    scope: BindingScope,
    signal?: AbortSignal,
  ) => Promise<{ items: unknown[]; raw?: unknown }>;
};

export type DataSource =
  | SparqlSelectSource
  | OverpassSource
  | RestSource
  | EntityByIriSource
  | AdapterSource;

export type HostPolicy = {
  minIntervalMs?: number;
  max?: number;
  windowMs?: number;
};
