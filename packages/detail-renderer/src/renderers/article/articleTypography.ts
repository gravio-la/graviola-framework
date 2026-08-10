import type { ElementType } from "react";
import type { ArticleHeadingToken } from "@graviola/edb-detail-renderer-core";
import { headingTokenForLevel } from "@graviola/edb-detail-renderer-core";
import type { TypographyProps } from "@mui/material";

/** Info-box label: single fixed pair so predicates never dwarf entity labels. */
export const ARTICLE_INFO_LABEL_SX = {
  fontWeight: 500,
  color: "text.secondary",
} as const;

export const ARTICLE_INFO_LABEL_VARIANT: TypographyProps["variant"] = "caption";
export const ARTICLE_INFO_VALUE_VARIANT: TypographyProps["variant"] = "body2";

/**
 * Map a heading level to MUI Typography props.
 * Caption-level headings use uppercase tracking for visual distinction.
 */
export function articleHeadingProps(level: number): {
  variant: TypographyProps["variant"];
  component: ElementType;
  sx?: TypographyProps["sx"];
} {
  const token: ArticleHeadingToken = headingTokenForLevel(level);
  if (token.variant === "caption") {
    return {
      variant: "caption",
      component: token.component,
      sx: {
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "text.secondary",
        display: "block",
      },
    };
  }
  return {
    variant: token.variant,
    component: token.component,
    sx: { fontWeight: 600, display: "block" },
  };
}
