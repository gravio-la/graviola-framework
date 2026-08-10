import type { UISchemaElement } from "@jsonforms/core";
import {
  DETAIL_NESTING_OPTIONS_KEY,
  type DetailNestingOptions,
  type DetailTesterContext,
} from "../types";

function readOptionsNesting(
  uiSchema: UISchemaElement,
): DetailNestingOptions | undefined {
  const opts = (uiSchema as { options?: Record<string, unknown> }).options;
  const bundle = opts?.[DETAIL_NESTING_OPTIONS_KEY];
  return bundle && typeof bundle === "object"
    ? (bundle as DetailNestingOptions)
    : undefined;
}

/**
 * Merge nesting options: inherited {@link DetailTesterContext.nesting} (from
 * config or parent layout) with this element's `options.nesting` (wins on conflict).
 * Under article presentation, `collapsible` is forced off unless
 * `forceCollapsibleInArticle` is set (headings replace carets).
 */
export function readNestingOptions(
  uiSchema: UISchemaElement,
  ctx: DetailTesterContext,
): DetailNestingOptions {
  const fromCtx = ctx.nesting ?? {};
  const fromUi = readOptionsNesting(uiSchema);
  const merged: DetailNestingOptions = fromUi
    ? { ...fromCtx, ...fromUi }
    : { ...fromCtx };

  if (
    ctx.presentation === "article" &&
    merged.collapsible &&
    !merged.forceCollapsibleInArticle
  ) {
    return { ...merged, collapsible: false };
  }
  return merged;
}

/** Context for child dispatch after resolving this element's nesting. */
export function childNestingContext(
  uiSchema: UISchemaElement,
  ctx: DetailTesterContext,
): DetailTesterContext {
  return { ...ctx, nesting: readNestingOptions(uiSchema, ctx) };
}
