import type { Bindings, DatasetCore, Quad, ResultStream } from "@rdfjs/types";
import type { NamespaceBuilder } from "@rdfjs/namespace";
import type { TypedGraphTraversalFilterOptions } from "./typed-filters";
export type * from "./settings";
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
export type PrimaryFieldDeclaration<Key extends string = string> = Partial<
  Record<Key, PrimaryField>
>;

/** M3 card surface variant. */
export type CardVariant = "elevated" | "filled" | "outlined";

/** Card layout orientation — vertical (media top) or horizontal (media side). */
export type CardOrientation = "vertical" | "horizontal";

/** Density / padding scale for cards in grids vs. lists. */
export type CardSize = "compact" | "standard" | "comfortable";

/** Built-in card action intents; `custom` is dispatched via `onCardAction`. */
export type CardActionIntent = "show" | "edit" | "custom";

export interface CardActionDef {
  id: string;
  label: string;
  /** Emoji or short label icon hint for storybook / simple cases. */
  icon?: string;
  intent: CardActionIntent;
  /** When true, render as M3 filled button; otherwise tonal/text. */
  primary?: boolean;
}

/** How secondary (non-primary) leaf properties are laid out on a card. */
export type CardSecondaryDisplay = "inline" | "stats";

/**
 * Per-type card presentation — parallel to {@link PrimaryField} for hero slots.
 * Configured on `AdbProvider.cardPresentation` or `viewConfig.card.options`.
 */
export interface CardPresentation {
  /** Explicit secondary property names (leaf literals). */
  secondaryFields?: string[];
  /** Max secondary fields when inferring from schema (default 3). */
  secondaryFieldLimit?: number;
  secondaryDisplay?: CardSecondaryDisplay;
  actions?: CardActionDef[];
  variant?: CardVariant;
  orientation?: CardOrientation;
  size?: CardSize;
  /** Reveal secondary fields in-place via expand affordance (not detail modal). */
  expandable?: boolean;
  /** CSS aspect-ratio for hero media (default `16 / 9`). */
  mediaAspectRatio?: string;
  /** Overlay headline/subhead on hero media with gradient scrim. */
  mediaOverlay?: boolean;
  /** Property name for a banner/header image (profile-card pattern). */
  banner?: string;
  /** Hide labels on secondary property rows for a cleaner card body. */
  hidePropertyLabels?: boolean;
}

export type CardPresentationRegistry = Record<string, CardPresentation>;

export type PrimaryFieldExtractDeclaration<
  T = any,
  Key extends string = string,
> = Partial<Record<Key, PrimaryFieldExtract<T>>>;

export type PrimaryFieldResults<T> = {
  label: T | null;
  description: T | null;
  image: T | null;
};

/** Props passed to app-supplied icon components (MUI SvgIcon, @mui/icons-material, etc.). */
export type PreviewIconProps = {
  fontSize?: number | string;
  color?: string;
  className?: string;
};

/**
 * React component (incl. MUI forwardRef/memo objects), render function, or emoji string.
 */
export type IconComponentLike =
  | ((props: PreviewIconProps) => unknown)
  | Record<string, unknown>;

/**
 * Type-level or MIME-level icon: emoji/label string, component, render fn, or
 * resolver evaluated per entity instance.
 */
export type IconRef = string | IconComponentLike | PreviewIconResolver;

/** Resolve an icon from instance `data` (e.g. pick MIME-specific icon). */
export type PreviewIconResolver = (
  ctx: PreviewMediaContext,
) => IconRef | undefined;

/** Optional per-instance image URL (thumbnail service, derived URL, base64). */
export type PreviewImageResolver = (
  ctx: PreviewMediaContext,
) => string | undefined;

export type PreviewMediaContext = {
  data: unknown;
  typeName: string;
  typeIRI?: string;
  mimeType?: string;
};

export type MimeIconMatcherMap = Record<string, IconRef>;
export type MimeIconMatcherFn = (
  mimeType: string,
  ctx: PreviewMediaContext,
) => IconRef | undefined;
export type MimeIconMatchers = MimeIconMatcherMap | MimeIconMatcherFn;

export interface TypePresentation {
  /** Default icon for this type (all instances unless MIME rule matches). */
  icon?: IconRef;
  /**
   * Same-type shape variants (e.g. files): map MIME type → icon, or a matcher fn.
   * Keys may be exact (`image/png`) or major (`image/*`).
   */
  iconByMime?: MimeIconMatchers;
  /** Dot-path on instance data for MIME type; default `mimeType`. */
  mimeTypePath?: string;
  /** App-provided image URL when instance primary field is not used. */
  image?: PreviewImageResolver;
  color?: string;
  backgroundPattern?: string;
  pluralLabel?: string;
  /** Shallow-merged on top of registry defaults after instance fields are read. */
  override?: (data: unknown) => Partial<EntityPreview>;
}

export type TypePresentationRegistry = Record<string, TypePresentation>;

export type PreviewDisplayMedia = "image" | "icon" | "initial" | "none";

/** Combined label/description/image (instance) + icon/color (type-level). */
export interface EntityPreview {
  label?: string;
  description?: string;
  /** Raw instance image from `primaryFields` or override (may not be shown if icon wins). */
  image?: string;
  /** Type-level icon ref before display precedence is applied. */
  icon?: IconRef;
  color?: string;
  backgroundPattern?: string;
  pluralLabel?: string;
  extras?: Record<string, unknown>;
  /**
   * Resolved chip/list avatar slot after precedence:
   * MIME icon → type icon → explicit image → initial letter → none.
   */
  displayMedia?: PreviewDisplayMedia;
  displayImage?: string;
  displayIcon?: IconRef;
}

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
  (
    query: string,
    options: { withHeaders: true } & SPARQLQueryOptions,
  ): Promise<RDFSelectResult>;
  (
    query: string,
    options?: { withHeaders?: false } & SPARQLQueryOptions,
  ): Promise<ResultBindings>;
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
    | "virtuoso"
    | "qlever"
    | "rest";
  defaultUpdateGraph?: string;
};

/**
 * SPARQL dialect / feature profile for query generation.
 *
 * - `default` / `oxigraph` / `blazegraph` / `allegro` — SPARQL 1.1 only.
 *   Nested `include` pagination (`take`/`skip`/`orderBy`) is applied at
 *   extraction time; CONSTRUCT never emits an uncorrelated SUBSELECT.
 * - `lateral` — emit SEP-0006 `LATERAL { SELECT ?anchor ?item … ORDER BY … LIMIT }`
 *   for per-parent windowing (Jena ≥ 4.7, Oxigraph ≥ 0.3.11). Not the same as
 *   the SPARQL 1.2 Working Draft; see `docs/sparql-lateral-windowing.md`.
 */
export type SPARQLFlavour =
  | "default"
  | "oxigraph"
  | "blazegraph"
  | "allegro"
  | "lateral";

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
   * - `"extraction"` — sort+slice in graph-traversal (default for SPARQL 1.1 flavours)
   * - `"query"` — already sliced by LATERAL SELECT LIMIT (`flavour: "lateral"`)
   */
  _stage?: "query" | "extraction";
};

/**
 * Include pattern for relationships with support for nested includes and pagination
 * - Set to `true` to include the relationship with default settings
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

// Legacy runtime (non-typed) filter operators - kept for backward compatibility
// @deprecated Use the typed versions above instead
export type WhereOperators = {
  equals?: any;
  not?: any;
  in?: any[];
  notIn?: any[];
  // String operators
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: "default" | "insensitive";
  // Numeric operators
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
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

export type { GenerationActivity } from "./provenance";
export { PROV, DCT, GRA, generationActivityToPredicates } from "./provenance";
