import type { Tester, UISchemaElement } from "@jsonforms/core";

import type { DetailArticleOptions, DetailTesterContext } from "../types";
import { DETAIL_ARTICLE_OPTIONS_KEY } from "../types";

/** Abstract heading token — MUI maps `variant`/`component` onto Typography. */
export type ArticleHeadingToken = {
  /** Visual style token (MUI Typography variant names). */
  variant: "h6" | "subtitle1" | "subtitle2" | "caption";
  /** Semantic HTML heading element. */
  component: "h2" | "h3" | "h4" | "h5" | "h6";
};

const HEADING_SCALE: ArticleHeadingToken[] = [
  { variant: "h6", component: "h2" },
  { variant: "subtitle1", component: "h3" },
  { variant: "subtitle2", component: "h4" },
  { variant: "caption", component: "h5" },
  { variant: "caption", component: "h6" },
];

/**
 * Map a 1-based HTML heading level (2–6) to a monotonic typography token.
 * Levels below 2 clamp to the first token; above 6 reuse the last.
 */
export function headingTokenForLevel(level: number): ArticleHeadingToken {
  const index = Math.max(0, Math.min(level - 2, HEADING_SCALE.length - 1));
  return HEADING_SCALE[index]!;
}

function readOptionsArticle(
  uiSchema: UISchemaElement,
): DetailArticleOptions | undefined {
  const opts = (uiSchema as { options?: Record<string, unknown> }).options;
  const bundle = opts?.[DETAIL_ARTICLE_OPTIONS_KEY];
  return bundle && typeof bundle === "object"
    ? (bundle as DetailArticleOptions)
    : undefined;
}

/**
 * Merge article options: inherited {@link DetailTesterContext.article} with
 * this element's `options.article` (wins on conflict).
 */
export function readArticleOptions(
  uiSchema: UISchemaElement,
  ctx: DetailTesterContext,
): DetailArticleOptions {
  const fromCtx = ctx.article ?? {};
  const fromUi = readOptionsArticle(uiSchema);
  // Always spread so callers cannot mutate the parent context object.
  return fromUi ? { ...fromCtx, ...fromUi } : { ...fromCtx };
}

/**
 * Context for child dispatch under ArticleLayout: sets presentation and
 * increments headingLevel (capped at 6).
 */
export function childArticleContext(
  ctx: DetailTesterContext,
  article?: DetailArticleOptions,
): DetailTesterContext {
  const start =
    article?.headingStartLevel ??
    ctx.article?.headingStartLevel ??
    ctx.headingLevel ??
    2;
  const current =
    ctx.presentation === "article" ? (ctx.headingLevel ?? start) : start;
  return {
    ...ctx,
    presentation: "article",
    headingLevel: Math.min(current + 1, 6),
    article: article ?? ctx.article,
  };
}

/**
 * Root article context when entering ArticleLayout (first section level).
 */
export function rootArticleContext(
  ctx: DetailTesterContext,
  article?: DetailArticleOptions,
): DetailTesterContext {
  const start =
    article?.headingStartLevel ?? ctx.article?.headingStartLevel ?? 2;
  return {
    ...ctx,
    presentation: "article",
    headingLevel: start,
    article: article ?? ctx.article,
  };
}

/**
 * Tester helper: true when `testerContext.config.presentation === "article"`.
 * JSON Forms testers receive DetailTesterContext as `context.config`.
 */
export const isArticlePresentation: Tester = (_uischema, _schema, context) => {
  const config = (context as { config?: DetailTesterContext } | undefined)
    ?.config;
  return config?.presentation === "article";
};
