import type { Bindings, DatasetCore, Quad, ResultStream } from "@rdfjs/types";
import type { NamespaceBuilder } from "@rdfjs/namespace";
export type * from "./settings";

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

export type NamespaceBuilderPrefixes = {
  prefixes: Record<string, NamespaceBuilder>;
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
export type PrimaryFieldDeclaration<Key extends string = string> = {
  [typeName: Key]: PrimaryField;
};

export type PrimaryFieldExtractDeclaration<
  T = any,
  Key extends string = string,
> = {
  [typeName: Key]: PrimaryFieldExtract<T>;
};

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
  sparqlFlavour?: SPARQLFlavour;
}
export interface SelectFetchOptions {
  withHeaders?: boolean;
}

export type SPARQLCRUDOptions = {
  queryBuildOptions?: SparqlBuildOptions;
  defaultPrefix: string;
  maxRecursion?: number;
  defaultUpdateGraph?: string;
};

export type ResultBindings = any[];

export type RDFSelectResult = {
  head: {
    vars: string[];
  };
  results: {
    bindings: ResultBindings;
  };
};

export type SelectFetchOverload = {
  (query: string, options: { withHeaders: true }): Promise<RDFSelectResult>;
  (query: string, options?: { withHeaders?: false }): Promise<ResultBindings>;
};

export type CRUDFunctions = {
  updateFetch: (
    query: string,
  ) => Promise<
    | ResultStream<any>
    | boolean
    | void
    | ResultStream<Bindings>
    | ResultStream<Quad>
    | Response
  >;
  constructFetch: (query: string) => Promise<DatasetCore>;
  selectFetch: SelectFetchOverload;
  askFetch: (query: string) => Promise<boolean>;
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
    | "virtuoso"
    | "qlever"
    | "rest";
  defaultUpdateGraph?: string;
};

export type SPARQLFlavour = "default" | "oxigraph" | "blazegraph" | "allegro";

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

export type BasicThingInformation = {
  id: string;
  label: string;
  secondary?: string;
  avatar?: string;
  category?: string;
  allProps?: Record<string, any>;
};

export type QueryBuilderOptions = {
  prefixes: Prefixes;
  defaultPrefix: string;
};

export type Permission = {
  view: boolean;
  edit: boolean;
};

export type PermissionDeclaration<T extends string> = {
  [typeName in T]: Permission;
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
 * The `source` field indicates where pagination was applied:
 * - "extraction": Apply during graph traversal (default)
 * - "query": Already applied at SPARQL CONSTRUCT query stage (skip during extraction)
 *
 * The `orderBy` field specifies sort criteria (Prisma-style):
 * - Required for consistent pagination on blank nodes (unnamed nodes)
 * - Optional for named nodes
 * - Can be single object or array: { name: 'asc' } or [{ name: 'asc' }, { createdAt: 'desc' }]
 */
export type PaginationMetadata = {
  /** Number of items to skip */
  skip?: number;
  /** Maximum number of items to take */
  take?: number;
  /** Where pagination was applied - prevents double pagination */
  source?: "extraction" | "query";
  /** Order by clause(s) for sorting - required for blank nodes */
  orderBy?: OrderByClause | OrderByClause[];
};

/**
 * Include pattern for relationships with support for nested includes and pagination
 * - Set to `true` to include the relationship with default settings
 * - Set to an object to configure pagination and nested includes
 */
export type IncludePattern<T = any> = {
  [K in keyof T]?:
    | boolean
    | (PaginationOptions & { include?: IncludePattern<T[K]> });
};

/**
 * Select pattern for explicitly choosing which fields to include in the result
 * When specified, only the selected fields will be included
 */
export type SelectPattern<T = any> = {
  [K in keyof T]?: boolean;
};

/**
 * Omit pattern for excluding specific fields from the result
 */
export type OmitPattern<T = any> = Array<keyof T>;

/**
 * Filter options for graph traversal with Prisma-style field selection
 * - `select`: Explicitly choose which fields to include
 * - `include`: Specify which relationships to include (with optional pagination)
 * - `omit`: Exclude specific fields from the result
 * - `includeRelationsByDefault`: Whether to include relationships by default (default: true)
 * - `defaultPaginationLimit`: Default limit for relationship pagination
 */
export type GraphTraversalFilterOptions = {
  select?: SelectPattern;
  include?: IncludePattern;
  omit?: OmitPattern;
  includeRelationsByDefault?: boolean;
  defaultPaginationLimit?: number;
  /**
   * Whether to exclude JSON-LD metadata properties (starting with @)
   * from schema normalization. Defaults to true.
   *
   * JSON-LD properties like @id, @type, @context, @graph are metadata
   * and should not be mapped to RDF predicates in SPARQL queries.
   */
  excludeJsonLdMetadata?: boolean;
};

/**
 * Extended walker options combining legacy options with new filter capabilities
 */
export type ExtendedWalkerOptions = WalkerOptions & GraphTraversalFilterOptions;

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
