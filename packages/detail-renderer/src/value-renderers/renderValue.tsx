import React, { createElement } from "react";
import { isControl } from "@jsonforms/core";
import type { ControlElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import {
  pickValueRenderer,
  readValueRendererOptions,
} from "@graviola/edb-detail-renderer-core";

import { PropertyRow } from "../renderers/PropertyRow";
import { defaultValueRenderers } from "./defaults";

export function shouldWrapValueInPropertyRow(
  ctx: DetailRendererProps["ctx"],
): boolean {
  const size = ctx.viewSize;
  return size === undefined || size === "detail";
}

export function renderValueWithRow(
  props: DetailRendererProps,
  fallback: (props: DetailRendererProps) => React.ReactNode,
): React.ReactNode {
  const { label, data, schema, uiSchema, ctx } = props;
  if (data == null || data === "") return null;

  const registry = ctx.valueRenderers ?? defaultValueRenderers;
  const entry = pickValueRenderer(registry, uiSchema, schema, ctx);

  let content: React.ReactNode;
  if (entry) {
    const options = readValueRendererOptions(uiSchema);
    const controlUi = uiSchema && isControl(uiSchema) ? uiSchema : undefined;
    content = createElement(entry.renderer, {
      value: data,
      schema,
      uiSchema: controlUi as ControlElement | undefined,
      options,
      ctx,
    });
  } else {
    content = fallback(props);
  }

  if (content == null) return null;

  if (shouldWrapValueInPropertyRow(ctx)) {
    return <PropertyRow label={label}>{content}</PropertyRow>;
  }

  return content;
}
