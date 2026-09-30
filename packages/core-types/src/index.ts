import type { Bindings, DatasetCore, Quad, ResultStream } from "@rdfjs/types";
import type { TypedGraphTraversalFilterOptions } from "./typed-filters";
export type * from "./entityActions";
export type * from "./presentation";
export type * from "./typed-filters";

export type Prefixes = {
  [k: string]: string;
};

export interface FetchConfig {
  accept: string;
  contentType: string;
  cache?: RequestCache;
  cors?: RequestMode;
}

export type AuthConfig = {
  username?: string;
  password?: string;
  token?: string;
};

export type FieldExtractDeclaration<T = any> =
  | string
  | ((entry: T) => string)
  | { path: string };

export type PrimaryField = Partial<{
  label: string;
  description: string;
  image: string;
}>;
export type PrimaryFieldExtract<T> = Partial<{
  label: FieldExtractDeclaration<T>;
  description: FieldExtractDeclaration<T>;
  image: FieldExtractDeclaration<T>;
}>;
export type PrimaryFieldDeclaration<Key extends string = string> = Partial<
  Record<Key, PrimaryField>
>;

export type PrimaryFieldExtractDeclaration<
  T = any,
  Key extends string = string,
> = Partial<Record<Key, PrimaryFieldExtract<T>>>;

export type PrimaryFieldResults<T> = {
  label: T | null;
  description: T | null;
  image: T | null;
};

export type NamedEntityData = {
  "@id": string;
  [key: string]: any;
};
export type NamedAndTypedEntity = NamedEntityData & {
  "@type": string;
};

export type StringToIRIFn = (property: string) => string;
export type IRIToStringFn = (iri: string) => string;
export interface SparqlBuildOptions {
  base?: string;
  prefixes?: Record<string, string>;
  propertyToIRI: StringToIRIFn;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  primaryFieldExtracts: PrimaryFieldExtractDeclaration;
  /** Engine/vendor profile id — resolved to {@link SparqlFeatureFlags} via resolveSparqlFeatures */
  sparqlFlavour?: SPARQLFlavour;
  /** Partial overrides merged on top of the flavour's default feature bag */
  sparqlFeatures?: Partial<SparqlFeatureFlags>;
}
export interface SelectFetchOptions {
  withHeaders?: boolean;
}

export type SPARQLCRUDOptions = {
  queryBuildOptions?: SparqlBuildOptions;
  defaultPrefix: string;
  maxRecursion?: number;
  /** When false, CONSTRUCT/load only expands explicitly included relations (Prisma-like). */
  includeRelationsByDefault?: boolean;
  /** Max depth at which inverse (x-inverseOf) properties are resolved. Default 0 = root only. */
  resolveInverseMaxDepth?: number;
  defaultUpdateGraph?: string;
};

export type SPARQLQueryType = "construct" | "select" | "ask" | "update";

export type SPARQLQueryLogMeta = {
  durationMs: number;
  error?: unknown;
};

export type SPARQLQueryOptions = {
  queryKey?: string;
};

export type SPARQLCRUDLogger = {
  logger?: Logger;
  /** Called after each SPARQL round-trip; fourth argument carries timing and optional error. */
  logQuery?: (
    queryKey: string | undefined,
    query: string,
    queryType: SPARQLQueryType,
    meta?: SPARQLQueryLogMeta,
  ) => void;
};

export type RDFSelectResult = {
  head: {
    vars: string[];
  };
  results: {
    bindings: any[];
  };
};

export type SelectFetchOverload = {
  (
    query: string,
    options: { withHeaders: true } & SPARQLQueryOptions,
  ): Promise<RDFSelectResult>;
  (
    query: string,
    options?: { withHeaders?: false } & SPARQLQueryOptions,
  ): Promise<any[]>;
};

export type CRUDFunctions = {
  updateFetch: (
    query: string,
    options?: SPARQLQueryOptions,
  ) => Promise<
    | ResultStream<any>
    | boolean
    | void
    | ResultStream<Bindings>
    | ResultStream<Quad>
    | Response
  >;
  constructFetch: (
    query: string,
    options?: SPARQLQueryOptions,
  ) => Promise<DatasetCore>;
  selectFetch: SelectFetchOverload;
  askFetch: (query: string, options?: SPARQLQueryOptions) => Promise<boolean>;
};

export type SparqlEndpoint = {
  label?: string;
  endpoint: string;
  active: boolean;
  auth?: AuthConfig;
  additionalHeaders?: Record<string, string>;
  provider?:
    | "allegro"
    | "oxigraph"
    | "worker"
    | "blazegraph"
    | "fuseki"
    | "virtuoso"
    | "qlever"
    | "rest";
  defaultUpdateGraph?: string;
};

/**
 * Additive SPARQL engine capabilities. Resolved from {@link SPARQLFlavour}
 * via `resolveSparqlFeatures` (in `@graviola/edb-core-utils` / remote-query);
 * query code branches on these flags, not on the flavour string.
 */
export type SparqlFeatureFlags = {
  /** SEP-0006 LATERAL nested include take/skip/orderBy (Oxigraph ≥ 0.3.11, Jena ≥ 4.7) */
  lateralNestedPagination?: boolean;
  /** Single-IRI subject via BIND (Oxigraph) */
  bindSingleSubject?: boolean;
  /** Oxigraph empty-group COUNT workaround */
  oxigraphEmptyGroupCount?: boolean;
  /** Blazegraph FTS search profile hint */
  blazegraphFulltextSearch?: boolean;
};

export type ResolvedSparqlFeatureFlags = Required<SparqlFeatureFlags>;

/**
 * Engine/vendor profile id for SPARQL query generation.
 * Maps to a {@link SparqlFeatureFlags} bag — not a single feature name.
 *
 * - `default` / `allegro` — SPARQL 1.1; nested pagination at extraction
 * - `oxigraph` — BIND + COUNT quirk + LATERAL nested pagination
 * - `jena` — LATERAL nested pagination (Fuseki ≥ 4.7)
 * - `blazegraph` — FTS search profile; nested pagination at extraction
 */
export type SPARQLFlavour =
  | "default"
  | "oxigraph"
  | "blazegraph"
  | "allegro"
  | "jena";

export type WorkerProvider = Record<
  NonNullable<SparqlEndpoint["provider"]>,
  | (<T = Record<string, any>>(
      endpointConfig: SparqlEndpoint,
      options?: T,
    ) => CRUDFunctions)
  | null
>;

export type QueryOptions = {
  defaultPrefix: string;
  queryBuildOptions: SparqlBuildOptions;
};

export type QueryBuilderOptions = {
  prefixes: Prefixes;
  defaultPrefix: string;
};

export type SameAsTypeMap = Record<string, string | string[]>;

export type NormDataMapping<MappingType> = {
  label: string;
  mapping: MappingType;
  sameAsTypeMap: SameAsTypeMap;
};

export type NormDataMappings<MappingType> = Record<
  string,
  NormDataMapping<MappingType>
>;

export type AutocompleteSuggestion = {
  label: string;
  value: string | null;
  image?: string;
  description?: string;
};

export type ColumnDesc<T> = {
  index: number;
  value: T;
  letter: string;
};

export type WalkerOptions = {
  omitEmptyArrays: boolean;
  omitEmptyObjects: boolean;
  maxRecursionEachRef: number;
  maxRecursion: number;
  skipAtLevel: number;
  doNotRecurseNamedNodes?: boolean;
};

/**
 * Sort order for ordering query results
 */
export type SortOrder = "asc" | "desc";

/**
 * Order by clause for a single property (Prisma-style)
 * Example: { name: 'asc' } or { createdAt: 'desc' }
 */
export type OrderByClause<T = any> = {
  [K in keyof T]?: SortOrder;
};

/**
 * Pagination options for limiting and offsetting relationship queries
 * Supports Prisma-style orderBy for sorting results
 */
export type PaginationOptions = {
  /** Maximum number of items to return */
  take?: number;
  /** Number of items to skip before returning results */
  skip?: number;
  /**
   * Order by clause(s) for sorting results (Prisma-style)
   * Can be a single object or array of objects
   * Example: { name: 'asc' } or [{ name: 'asc' }, { createdAt: 'desc' }]
   * Note: Required for pagination on blank nodes (unnamed nodes)
   */
  orderBy?: OrderByClause | OrderByClause[];
};

/**
 * Pagination metadata that can be attached to array schemas
 *
 * The `_stage` field indicates where pagination was applied:
 * - "extraction": Apply during graph traversal (default)
 * - "query": Already applied at SPARQL CONSTRUCT query stage (skip during extraction)
 *
 * The `orderBy` field specifies sort criteria (Prisma-style):
 * - Required for consistent pagination on blank nodes (unnamed nodes)
 * - Optional for named nodes
 * - Can be single object or array: { name: 'asc' } or [{ name: 'asc' }, { createdAt: 'desc' }]
 */
export type PaginationMetadata = PaginationOptions & {
  /**
   * Where pagination was / should be applied:
   * - `"extraction"` — sort+slice in graph-traversal (default when LATERAL is off)
   * - `"query"` — already sliced by LATERAL SELECT LIMIT (`lateralNestedPagination`)
   */
  _stage?: "query" | "extraction";
};

/**
 * Include pattern for relationships with support for nested includes and pagination
 * - Set to `true` to include the relationship with defaults
 * - Set to an object to configure pagination and nested includes
 *
 * @template T - The type to derive include pattern from (optional, defaults to any for backward compatibility)
 *
 * @example
 * ```typescript
 * // With Zod type inference for type safety
 * import { z } from 'zod';
 * const schema = z.object({ name: z.string(), friends: z.array(z.object({ name: z.string() })) });
 * type Person = z.infer<typeof schema>;
 *
 * const include: IncludePattern<Person> = {
 *   friends: { take: 10, include: { name: true } }
 * };
 *
 * // Without type parameter (backward compatible)
 * const include2: IncludePattern = {
 *   friends: { take: 10 }
 * };
 * ```
 */

/**
 * Validation mode for runtime filter validation
 * - 'throw': Throw an error if filter validation fails
 * - 'warn': Log a warning to console if filter validation fails
 * - 'ignore': Skip validation entirely (default)
 */
export type FilterValidationMode = "throw" | "warn" | "ignore";

// Re-export type-safe filter types from typed-filters module
export type {
  StringFilterOperators,
  NumberFilterOperators,
  BooleanFilterOperators,
  DateTimeFilterOperators,
  GeoFilterOperators,
  FilterOperatorsForType,
  TypedWhereInput as WhereInput,
  FlavourAwareWhereInput,
  TypedSelectPattern as SelectPattern,
  TypedOmitPattern as OmitPattern,
  TypedIncludePattern as IncludePattern,
  TypedGraphTraversalFilterOptions as GraphTraversalFilterOptions,
} from "./typed-filters";

/**
 * Extended walker options combining legacy options with new filter capabilities
 *
 * @template T - The type to derive filter patterns from (optional, defaults to any for backward compatibility)
 */
export type ExtendedWalkerOptions<T = any> = WalkerOptions &
  TypedGraphTraversalFilterOptions<T>;

export type Entity = {
  entityIRI: string;
  typeIRI: string;
  // @deprecated use entityIRI instead
  value: string;
  name?: string;
  label?: string;
  description?: string;
  image?: string;
};

/**
 * Log levels for the logger
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Logger interface for structured logging during graph extraction
 * Provides a facade that can be implemented by any logging framework
 */
export interface Logger {
  /**
   * Start a timer with a label
   * @param label The label to identify the timer
   */
  time(label: string): void;
  /**
   * Stop a timer with a label
   * @param label The label to identify the timer
   */
  timeEnd(label: string): void;
  /**
   * Log debug information (detailed execution flow)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  debug(message: string, context?: Record<string, any>): void;

  /**
   * Log informational messages (high-level operations)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  info(message: string, context?: Record<string, any>): void;

  /**
   * Log warning messages (non-fatal issues)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  warn(message: string, context?: Record<string, any>): void;

  /**
   * Log error messages (failures)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  error(message: string, context?: Record<string, any>): void;
}
