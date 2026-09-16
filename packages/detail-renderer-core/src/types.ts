import type {
  EntityActionDef,
  EntityPreview,
  ViewDensity,
} from "@graviola/edb-core-types";
import type { SchemaScopeFrame } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import type { RankedTester, UISchemaElement } from "@jsonforms/core";
import type React from "react";

export type ViewSize = "chip" | "listItem" | "card" | "detail";

/**
 * How {@link TopLevelLayoutRenderer} orders the hero (primary fields) vs. nested property controls.
 *
 * - `default` — hero card (image, title, description) first, then a divider, then property rows.
 * - `singleCardPropertiesFirst` — one unified card: full-bleed hero image with rounded top (flush to
 *   the dialog/card edge), then headline, subtitle, divider, then property rows.
 */
export type DetailTopLevelLayoutVariant =
  | "default"
  | "singleCardPropertiesFirst";

/**
 * Presentation mode for detail control renderers.
 * - `default` — NestedSection / PropertyRow tree presentation.
 * - `article` — headed sections + info-box literals (ArticleLayout).
 */
export type DetailPresentation = "default" | "article";

/** Per-node context for dispatch and JSON Forms–style testers. */
export interface DetailTesterContext {
  rootSchema: JSONSchema7;
  depth: number;
  maxDepth: number;
  viewSize?: ViewSize;
  density?: ViewDensity;
  frame?: SchemaScopeFrame;
  typeIRI?: string;
  typeName?: string;
  typeIRIToTypeName?: (iri: string) => string | undefined;
  /** @deprecated Use {@link preview} */
  headerPreview?: {
    label: string | null;
    description: string | null;
    image: string | null;
  } | null;
  preview?: EntityPreview | null;
  entityIRI?: string;
  humanLabel?: string;
  isLoading?: boolean;
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
  headerPrimaryFieldNames?: string[];
  /** Inherited from merged {@link DetailViewConfig}; drives {@link TopLevelLayoutRenderer}. */
  topLevelLayoutVariant?: DetailTopLevelLayoutVariant;
  /** Resolved nesting options inherited from config or enclosing layouts. */
  nesting?: DetailNestingOptions;
  /**
   * Article vs default presentation. Set by ArticleLayoutRenderer when dispatching
   * object-property children so article control renderers win via tester gate.
   */
  presentation?: DetailPresentation;
  /**
   * Current heading level for article sections (HTML h2–h6). Starts at
   * {@link DetailArticleOptions.headingStartLevel} (default 2).
   */
  headingLevel?: number;
  /** Resolved article options inherited from config or enclosing ArticleLayout. */
  article?: DetailArticleOptions;
  /** Merged registry used by leaf renderers for inline value formatting. */
  valueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
}

export interface DetailRendererRegistryEntry {
  tester: RankedTester;
  renderer: React.ComponentType<DetailRendererProps>;
}

export interface DetailRendererProps {
  schema: JSONSchema7;
  data: unknown;
  path: string[];
  label: string;
  uiSchema: UISchemaElement;
  dispatch: DetailDispatch;
  rootSchema: JSONSchema7;
  rootData: unknown;
  ctx: DetailTesterContext;
  /**
   * Pick a concrete renderer for an alternate schema (anyOf/oneOf branches) without
   * changing the UISchema Control scope.
   */
  resolveRenderer?: (schema: JSONSchema7) => React.ReactNode;
}

export type DetailDispatch = (params: {
  uiSchema: UISchemaElement;
  ctx?: DetailTesterContext;
}) => React.ReactNode;

/**
 * JSON Forms `ControlElement.options.detailArrayInline` — presentation hints for arrays
 * rendered by compact inline-object layouts (typically `ArrayInlineObjectRenderer`).
 */
export interface DetailArrayInlineControlOptions {
  /** Omit per-item borders / extra spacing */
  compactItems?: boolean;
  /** Arrange items horizontally (row) like chips, or vertically (column). */
  itemLayout?: "column" | "row";
  /** If set, omit all other JSON properties on each item schema root when generating item UI */
  itemIncludeProperties?: string[];
  /** Use empty JsonForms labels on rendered item leaf controls */
  hidePropertyLabels?: boolean;
}

export const DETAIL_ARRAY_INLINE_OPTIONS_KEY = "detailArrayInline" as const;

/**
 * JSON Forms `ControlElement.options.nesting` / layout `options.nesting` —
 * foldable nesting for a property or layout subtree.
 */
export interface DetailNestingOptions {
  /** Full-width foldable section instead of caption + indented block. Default false. */
  collapsible?: boolean;
  /** Section starts expanded. Default true. */
  defaultExpanded?: boolean;
  /** Suppress the guide rule / indent for this level. */
  flat?: boolean;
  /**
   * Keep collapsible chrome under article presentation.
   * By default article mode forces `collapsible: false` (headings replace carets).
   */
  forceCollapsibleInArticle?: boolean;
}

export const DETAIL_NESTING_OPTIONS_KEY = "nesting" as const;

/**
 * JSON Forms `UISchemaElement.options.relationVia` — render an array of reification /
 * intermediate nodes as a list of the entity each node points at.
 */
export interface DetailRelationViaOptions {
  /** Property on the intermediate item holding the displayed entity. Required. */
  target: string;
  /** View size for the target. Default `"listItem"`. */
  targetAs?: ViewSize;
  /** Merge repeated occurrences of the same target into one row. Default true. */
  groupByTarget?: boolean;
  /** Item properties rendered per occurrence. Default: all except `target`, `@id`, `@type`. */
  qualifierProperties?: string[];
  /** Joined between qualifier values of one occurrence. Default `" – "`. */
  qualifierSeparator?: string;
  /** Text substituted when a qualifier value is nullish, e.g. `{ to: "today" }`. */
  qualifierEmptyText?: Record<string, string>;
  /** `"trailing"` (right-aligned beside the target) or `"below"`. Default `"trailing"`. */
  qualifierPlacement?: "trailing" | "below";
  /** Full escape hatch: UISchema dispatched against the item schema, one per occurrence. */
  occurrenceUiSchema?: UISchemaElement;
  /** Dot path inside the item used to order occurrences within a group. */
  sortOccurrencesBy?: string;
  sortDirection?: "asc" | "desc";
  /** Divider between target rows. Default true. */
  dividers?: boolean;
}

export const DETAIL_RELATION_VIA_OPTIONS_KEY = "relationVia" as const;

/**
 * JSON Forms `UISchemaElement.options.article` / {@link DetailViewConfig.article} —
 * presentation hints for {@link ArticleLayout}.
 */
export interface DetailArticleOptions {
  /**
   * Info-box placement for literal properties.
   * - `aside` — floated right beside sections (stacks under `sm`).
   * - `block` — full-width block above sections.
   * Default `"aside"`.
   */
  infoBox?: "aside" | "block";
  /** CSS width for the aside info box (e.g. `"16rem"`). Default `"16rem"`. */
  infoBoxWidth?: string;
  /** HTML heading level for the first article section. Default `2`. */
  headingStartLevel?: number;
  /**
   * An object property becomes a headed section when it has at least one
   * object-typed child, or more than this many literal children. Smaller
   * objects stay in the info box. Default `2`.
   */
  sectionThreshold?: number;
}

export const DETAIL_ARTICLE_OPTIONS_KEY = "article" as const;

export interface DetailViewConfig {
  maxDepth?: number;
  extraRenderers?: DetailRendererRegistryEntry[];
  /** Lowest-priority entries appended after the size defaults (e.g. AllPropsTable). */
  fallbackRenderers?: DetailRendererRegistryEntry[];
  overrideRenderers?: DetailRendererRegistryEntry[];
  /** App value formatters; merged before framework defaults unless overridden. */
  valueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
  /** Highest-priority value formatters (prepended to the merged registry). */
  overrideValueRenderers?: import("./value-renderers/types").ValueRendererEntry[];
  /** Per-type-name UISchema roots */
  uiSchemata?: Record<string, UISchemaElement>;
  /** Per-type-IRI UISchema roots */
  uiSchemataByTypeIRI?: Record<string, UISchemaElement>;
  typeIRIOverrides?: Record<string, Partial<DetailViewConfig>>;
  typeNameOverrides?: Record<string, Partial<DetailViewConfig>>;
  /** Typically `useAdbContext().typeIRIToTypeName` */
  typeIRIToTypeName?: (iri: string) => string | undefined;
  /** Typically adb `primaryFields` map — used by TopLevelLayout (binding) for header fields */
  primaryFields?: Record<string, unknown>;
  hideLinkedDataProperties?: boolean;
  linkedDataPropertyNames?: string[];
  hideHeaderPrimaryFields?: boolean;
  hiddenPropertyNames?: string[];
  alwaysShowPropertyNames?: string[];
  /** Top-level detail layout; default is `"default"`. */
  topLevelLayoutVariant?: DetailTopLevelLayoutVariant;
  /**
   * Root layout type used when generating a default detail UISchema
   * (`"TopLevelLayout"` | `"ArticleLayout"` | …). Default `"TopLevelLayout"`.
   */
  detailLayoutType?: string;
  /** App-wide default for foldable nested sections. Per-scope overrides via UI schema. */
  nesting?: DetailNestingOptions;
  /** App-wide default for ArticleLayout presentation. Per-layout overrides via UI schema. */
  article?: DetailArticleOptions;
  /** Per-type card presentation merged into generated CardLayout options. */
  cardPresentation?: import("@graviola/edb-core-types").CardPresentation;
  /** Entity action callback for `custom` intents on declared actions. */
  onEntityAction?: (
    actionId: string,
    ctx: {
      entityIRI?: string;
      typeIRI?: string;
      typeName?: string;
      data: unknown;
    },
  ) => void;
  /** @deprecated Use {@link onEntityAction}. */
  onCardAction?: DetailViewConfig["onEntityAction"];
  /** Property-driven entity actions (parallel to {@link ChipsConfig}). */
  entityActions?: import("./actions/types").EntityActionsConfig;
  /** @deprecated Use {@link entityActions}. */
  cardActions?: import("./actions/types").EntityActionsConfig;
  density?: ViewDensity;
}

export interface EntityActionRendererProps {
  action: EntityActionDef;
  schema: JSONSchema7;
  data: unknown;
  entityIRI?: string;
  onIntent?: (intent: EntityActionDef["intent"]) => void;
  onCustom?: () => void;
}

export interface ChipDefinition {
  label: (data: unknown, schema: JSONSchema7) => string | null;
  image?: (data: unknown, schema: JSONSchema7) => string | null | undefined;
  icon?: React.ComponentType<{ fontSize?: string }>;
  color?: (data: unknown, schema: JSONSchema7) => string | undefined;
  backgroundPattern?: (
    data: unknown,
    schema: JSONSchema7,
  ) => string | undefined;
  popoverContent?: React.ComponentType<{ data: unknown; schema: JSONSchema7 }>;
}

export interface ChipRendererProps {
  schema: JSONSchema7;
  data: unknown;
  path: string[];
  definition: ChipDefinition;
  onClick?: () => void;
  variant?: "chip" | "label";
}

export interface ChipRendererEntry {
  tester: RankedTester;
  computeDefinition: (
    schema: JSONSchema7,
    data: unknown,
    path: string[],
  ) => ChipDefinition;
  renderer: React.ComponentType<ChipRendererProps>;
}

export interface ChipsConfig {
  byTypeIRI?: Record<string, ChipRendererEntry | ChipDefinition>;
  registry?: ChipRendererEntry[];
}

export type { Tester } from "@jsonforms/core";
