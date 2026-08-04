import type {
  CRUDFunctions,
  SparqlBuildOptions,
  StringToIRIFn,
  WalkerOptions,
} from "@graviola/edb-core-types";
import type { DatastoreBaseConfig } from "@graviola/edb-global-types";
import type { MetaStampingConfig } from "@graviola/meta-schema";
import type { StoreFilterTraversalOptions } from "@graviola/store-core";
import type { JSONSchema7 } from "json-schema";

/**
 * Defaults merged into every `filterTypedDocument(s)` / `filterOne` / `filterMany`
 * call. Per-call options win. Use to set Prisma-like relation behaviour once:
 * `{ includeRelationsByDefault: false, maxRecursion: 2 }`.
 */
export type SPARQLDefaultFilterOptions = Pick<
  StoreFilterTraversalOptions,
  | "includeRelationsByDefault"
  | "maxRecursion"
  | "excludeJsonLdMetadata"
  | "defaultPaginationLimit"
  | "filterValidationMode"
>;

export type SPARQLDataStoreConfig = {
  defaultPrefix: string;
  jsonldContext: object | string;
  typeNameToTypeIRI: StringToIRIFn;
  queryBuildOptions: SparqlBuildOptions;
  walkerOptions?: Partial<WalkerOptions>;
  sparqlQueryFunctions: CRUDFunctions;
  defaultLimit?: number;
  makeStubSchema?: (schema: JSONSchema7) => JSONSchema7;
  enableInversePropertiesFeature?: boolean;
  defaultUpdateGraph?: string;
  /** Opt-in entity `$meta` stamping on upsert (default: disabled). */
  metaStamping?: MetaStampingConfig;
  /**
   * Defaults for typed-filter queries (merged under per-call options).
   * Relation includes default to off (Prisma-like) unless overridden here or
   * per call.
   */
  defaultFilterOptions?: SPARQLDefaultFilterOptions;
} & DatastoreBaseConfig;
