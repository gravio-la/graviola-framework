import type { UISchemaElement } from "@jsonforms/core";
import { isLayout } from "@jsonforms/core";

/**
 * Custom Graviola layout `type` values that may not satisfy JSON Forms
 * `isLayout` (which requires `elements`). Kept in sync with registry entries.
 */
export const GRAVIOLA_LAYOUT_TYPES = new Set<string>([
  "TopLevelLayout",
  "ArticleLayout",
  "ChipLayout",
  "ListItemLayout",
  "CardLayout",
]);

/** True when the UISchema element is a layout (JSON Forms or Graviola custom). */
export function isGraviolaDetailLayout(uischema: UISchemaElement): boolean {
  if (isLayout(uischema)) return true;
  const type = (uischema as { type?: string }).type;
  return typeof type === "string" && GRAVIOLA_LAYOUT_TYPES.has(type);
}
