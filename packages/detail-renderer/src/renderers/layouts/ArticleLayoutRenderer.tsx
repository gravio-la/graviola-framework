import React from "react";
import { Box } from "@mui/material";
import type { ControlElement, Layout } from "@jsonforms/core";
import { camelCaseToTitleCase } from "@graviola/edb-core-utils";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import {
  partitionArticleElements,
  readArticleOptions,
  rootArticleContext,
  childArticleContext,
  childNestingContext,
  pathFromScope,
} from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

import { ArticleInfoBox } from "../article/ArticleInfoBox";
import { ArticleSection } from "../article/ArticleSection";
import { DetailHero } from "./DetailHero";

/**
 * Article-style detail root: hero title, literal info box, then object
 * properties as headed sections (no tree indentation).
 */
export function ArticleLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
  rootSchema,
}: DetailRendererProps) {
  const layout = uiSchema as Layout & {
    options?: { headline?: string; article?: Record<string, unknown> };
  };
  const elements = layout.elements ?? [];
  const article = readArticleOptions(uiSchema, ctx);
  const placement = article.infoBox ?? "aside";
  const infoBoxWidth = article.infoBoxWidth ?? "16rem";

  const { labels, literals, objects } = partitionArticleElements(
    elements,
    rootSchema as JSONSchema7,
    article,
  );

  const articleRootCtx = rootArticleContext(ctx, article);
  const sectionCtx = childNestingContext(
    uiSchema,
    childArticleContext(articleRootCtx, article),
  );
  const headingLevel = articleRootCtx.headingLevel ?? 2;

  return (
    <Box sx={{ overflow: "auto" }}>
      <Box sx={{ mb: 2 }}>
        <DetailHero
          ctx={articleRootCtx}
          headline={layout.options?.headline}
          variant="none"
        />
      </Box>

      {labels.map((el, i) => (
        <React.Fragment key={`label-${i}`}>
          {dispatch({ uiSchema: el, ctx: articleRootCtx })}
        </React.Fragment>
      ))}

      <ArticleInfoBox
        controls={literals}
        dispatch={dispatch}
        ctx={articleRootCtx}
        placement={placement}
        width={infoBoxWidth}
      />

      <Box>
        {objects.map((el, i) => {
          if ((el as ControlElement).type === "Control") {
            const control = el as ControlElement;
            // Section heading from control label; child renderers get blank label
            // so they don't double-print the property name.
            const pathParts = pathFromScope(control.scope ?? "#");
            const propName = pathParts[pathParts.length - 1] ?? "";
            const sectionLabel =
              (typeof control.label === "string" && control.label) ||
              camelCaseToTitleCase(propName);
            const blankLabelControl: ControlElement = {
              ...control,
              label: "",
            };
            return (
              <ArticleSection
                key={control.scope ?? i}
                label={sectionLabel}
                headingLevel={headingLevel}
              >
                {dispatch({ uiSchema: blankLabelControl, ctx: sectionCtx })}
              </ArticleSection>
            );
          }
          return (
            <React.Fragment key={i}>
              {dispatch({ uiSchema: el, ctx: sectionCtx })}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}
