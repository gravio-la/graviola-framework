import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

/** Detail view section title for a property control directly under the top layout (runtime depth 1). */
export function isTopLevelSection(
  ctx: DetailTesterContext,
  label?: string,
): boolean {
  const isDetail = !ctx.viewSize || ctx.viewSize === "detail";
  if (!isDetail || ctx.depth > 1) return false;
  if (label === undefined) return true;
  return typeof label === "string" && label.trim().length > 0;
}

/** Nested detail rows stack label above value; top-level scalars keep the label column grid. */
export function shouldStackPropertyRow(ctx: DetailTesterContext): boolean {
  return ctx.depth >= 2;
}
