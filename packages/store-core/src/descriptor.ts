import type { SpeaksNative } from "./capabilities/speaks-native";

export type SearchesProfile = {
  mode: "substring" | "token" | "fulltext";
  ranked: boolean;
  caseSensitive?: boolean;
  perFieldWeights?: boolean;
};

export type CountsProfile = {
  cost: "O(1)" | "O(n)";
};

export type WritesProfile = {
  atomic: boolean;
  bulkOptimized: boolean;
};

export type StreamsProfile = {
  style: "cursor" | "buffer";
};

export type EntityMetaProfile = {
  encoding: "named-graph" | "triples" | "column" | "pipeline";
  lifecycleTimestamps?: false | "application" | "database-native";
};

export type StatementMetaProfile = {
  encoding: "statement-node" | "rdf-12" | "side-table" | "named-graph" | "none";
};

/**
 * Where nested `include.take` / `skip` / `orderBy` are applied.
 * - `"query"` — SEP-0006 LATERAL windowing (`lateralNestedPagination`)
 * - `"extraction"` — full edges in CONSTRUCT, then sort+slice in graph-traversal
 */
export type NestedPaginationProfile = {
  stage: "query" | "extraction";
};

export type CapabilityProfiles = {
  searches?: SearchesProfile;
  counts?: CountsProfile;
  writes?: WritesProfile;
  streams?: StreamsProfile;
  entityMeta?: EntityMetaProfile;
  statementMeta?: StatementMetaProfile;
  nestedPagination?: NestedPaginationProfile;
  /** Resolved SPARQL dialect features (from engine profile + overrides) */
  sparqlFeatures?: {
    lateralNestedPagination: boolean;
    bindSingleSubject: boolean;
    oxigraphEmptyGroupCount: boolean;
    blazegraphFulltextSearch: boolean;
  };
  /** e.g. `["sparql"]` for native escape hatch */
  speaksNative?: string[];
};

export type CapabilityName =
  | "identifies"
  | "loads"
  | "lists"
  | "flatResultSet"
  | "filters"
  | "searches"
  | "counts"
  | "writes"
  | "statements"
  | "removes"
  | "streams"
  | "imports"
  | "textSearches"
  | "aggregates"
  | "speaksNative"
  | "resolves"
  | "exists";

/**
 * Runtime mirror of implemented capabilities — used for routing and federation.
 * Boolean flags mark presence; use `profiles` for search/count/write routing detail.
 */
export type CapabilityDescriptor = {
  /** Always true when this object describes a valid store */
  identifies: true;
  loads?: true;
  lists?: true;
  flatResultSet?: true;
  filters?: true;
  searches?: true;
  counts?: true;
  writes?: true;
  statements?: true;
  removes?: true;
  streams?: true;
  imports?: true;
  textSearches?: true;
  aggregates?: true;
  speaksNative?: true;
  resolves?: true;
  exists?: true;
  profiles?: CapabilityProfiles;
};

/**
 * Descriptor-only capability check (e.g. handshake metadata before a Store exists).
 * For store instances, use {@link hasCapability} from `./capability-guards`.
 */
export function hasCapabilityInDescriptor(
  descriptor: CapabilityDescriptor,
  name: CapabilityName,
): boolean {
  if (name === "identifies") return descriptor.identifies === true;
  return Boolean(descriptor[name]);
}

export function speaksLanguage(
  store: Pick<SpeaksNative<string, unknown>, "nativeQuery"> & {
    capabilities: CapabilityDescriptor;
  },
  lang: string,
): boolean {
  const langs = store.capabilities.profiles?.speaksNative;
  return Array.isArray(langs) && langs.includes(lang);
}
