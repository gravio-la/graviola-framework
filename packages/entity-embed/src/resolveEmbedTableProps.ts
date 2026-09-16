import type {
  EntityQuerySpec,
  EntityQueryTableToolbar,
} from "@graviola/entity-ref-core";
import type {
  SemanticTableDensity,
  SemanticTableToolbarDisplay,
  SemanticTableWidth,
} from "@graviola/edb-table-components";

export type EmbedTableProps = {
  toolbarDisplay: SemanticTableToolbarDisplay;
  density: SemanticTableDensity;
  width: SemanticTableWidth;
  enableRowSelection: boolean;
};

const DEFAULT_EMBED_TABLE: EmbedTableProps = {
  toolbarDisplay: "hover",
  density: "comfortable",
  width: "full-width",
  enableRowSelection: false,
};

function mapToolbar(
  toolbar: EntityQueryTableToolbar | undefined,
): SemanticTableToolbarDisplay {
  switch (toolbar) {
    case "always":
      return "static";
    case "never":
      return "never";
    case "hover":
    default:
      return "hover";
  }
}

/** Resolve markdown `graviola-query` table UI options for `SemanticTable`. */
export function resolveEmbedTableProps(spec: EntityQuerySpec): EmbedTableProps {
  const ui = spec.table;
  if (!ui) {
    return DEFAULT_EMBED_TABLE;
  }
  return {
    toolbarDisplay: mapToolbar(ui.toolbar),
    density: ui.density ?? DEFAULT_EMBED_TABLE.density,
    width: ui.width ?? DEFAULT_EMBED_TABLE.width,
    enableRowSelection: ui.selection ?? DEFAULT_EMBED_TABLE.enableRowSelection,
  };
}
