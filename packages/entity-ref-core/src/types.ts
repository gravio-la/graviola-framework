/** How an inline entity reference is rendered in markdown preview. */
export type EntityEmbedView = "inline" | "chip" | "card";

/** How a block query embed is rendered. */
export type EntityQueryView = "table" | "list";

/** Parsed reference to a knowledge-base entity embedded in markdown. */
export type EntityRef = {
  entityId: string;
  typeName?: string;
  entityIRI?: string;
  view?: EntityEmbedView;
  params?: Record<string, string>;
  label?: string;
};

/** MRT row density for `view: table` embeds. */
export type EntityQueryTableDensity = "comfortable" | "compact" | "spacious";

/** Toolbar visibility for embedded tables. */
export type EntityQueryTableToolbar = "never" | "hover" | "always";

/** Horizontal sizing for embedded tables. */
export type EntityQueryTableWidth = "full-width" | "auto";

/** Optional presentation controls for `view: table` query embeds. */
export type EntityQueryTableUi = {
  density?: EntityQueryTableDensity;
  toolbar?: EntityQueryTableToolbar;
  width?: EntityQueryTableWidth;
  /** Row-selection checkbox column. Default false in markdown embeds. */
  selection?: boolean;
};

/** Block embed: list/table of entities matching a typed filter. */
export type EntityQuerySpec = {
  typeName: string;
  view?: EntityQueryView;
  limit?: number;
  where?: Record<string, unknown>;
  table?: EntityQueryTableUi;
};

/** YAML frontmatter bindings for standalone markdown documents (Mode A). */
export type DocumentBinding = {
  endpoint?: string;
  knowledgeBaseId?: string;
  baseIRI?: string;
  entityBaseIRI?: string;
  typeMappings?: Record<string, string>;
  defaultView?: EntityEmbedView;
};

export type EntityRefResolveContext = {
  baseIRI?: string;
  entityBaseIRI?: string;
  typeNameToTypeIRI?: (typeName: string) => string;
};

export type SerializeEntityRefOptions = {
  syntax?: "uri" | "wikilink";
  defaultView?: EntityEmbedView;
};
