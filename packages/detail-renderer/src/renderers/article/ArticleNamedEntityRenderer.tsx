import React from "react";
import type { ControlElement } from "@jsonforms/core";
import startCase from "lodash-es/startCase";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import {
  childArticleContext,
  classifyResolvedSchema,
  extendPropertyScope,
  isSectionWorthyObjectSchema,
  resolvePropertySchema,
} from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";
import { Box } from "@mui/material";

import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "../ContainedEntityView";
import { ArticleSection } from "./ArticleSection";

/**
 * Named entity under article presentation.
 * Section-worthy entities expand as headed sections with recursive property
 * dispatch; others stay as contained chips/cards.
 *
 * Nested `relationVia` / scope overrides from
 * `config.defaultGenerationOptions.scopeOverride` are not yet applied to
 * hand-built child controls here — that remains an open gap.
 */
export function ArticleNamedEntityRenderer({
  label,
  data,
  schema,
  uiSchema,
  dispatch,
  ctx,
  rootSchema,
}: DetailRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const s = schema as JSONSchema7;
  const containedAs = containedAsFromUiSchema(
    uiSchema as ControlElement,
    "chip",
  );

  const headingLevel = ctx.headingLevel ?? 2;
  const showHeading = typeof label === "string" && label.trim().length > 0;
  const expandInline = s.properties != null && isSectionWorthyObjectSchema(s);

  if (!expandInline) {
    const chip = (
      <ContainedEntityView
        data={d}
        schema={s}
        containedAs={containedAs}
        ctx={ctx}
      />
    );
    if (!showHeading) return chip;
    return (
      <ArticleSection label={label} headingLevel={headingLevel}>
        {chip}
      </ArticleSection>
    );
  }

  const childCtx = childArticleContext(ctx);
  const sectionHeadingLevel = childCtx.headingLevel ?? headingLevel + 1;
  const parentScope = (uiSchema as ControlElement).scope ?? "#";
  const propsMap = s.properties!;

  const children = Object.entries(propsMap)
    .filter(([key]) => !key.startsWith("@"))
    .map(([key, propSchema]) => {
      const resolved = resolvePropertySchema(
        propSchema as JSONSchema7,
        rootSchema as JSONSchema7,
      );
      const childScope = extendPropertyScope(parentScope, key);
      const childUi: ControlElement = {
        type: "Control",
        scope: childScope,
        label: "",
        options: {},
      };
      const cls = classifyResolvedSchema(resolved, false, ctx.article);
      const rendered = dispatch({ uiSchema: childUi, ctx: childCtx });
      if (rendered == null) return null;

      if (cls === "literal") {
        return <Box key={key}>{rendered}</Box>;
      }

      const sectionLabel =
        (typeof (propSchema as JSONSchema7).title === "string"
          ? (propSchema as JSONSchema7).title
          : null) ?? startCase(key);

      return (
        <ArticleSection
          key={key}
          label={sectionLabel}
          headingLevel={sectionHeadingLevel}
        >
          {rendered}
        </ArticleSection>
      );
    })
    .filter(Boolean);

  const body = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {children}
    </Box>
  );

  if (!showHeading) return body;

  return (
    <ArticleSection label={label} headingLevel={headingLevel}>
      {body}
    </ArticleSection>
  );
}
