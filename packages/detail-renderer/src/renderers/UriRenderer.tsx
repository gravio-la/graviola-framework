import React from "react";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { UriValueRenderer } from "../value-renderers/UriValueRenderer";
import { PropertyRow } from "./PropertyRow";
import { renderValueWithRow } from "../value-renderers/renderValue";

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i;

function uriFallback(props: DetailRendererProps) {
  return (
    <UriValueRenderer
      value={props.data}
      schema={props.schema}
      ctx={props.ctx}
    />
  );
}

export function UriRenderer(props: DetailRendererProps) {
  const { label, data, ctx } = props;
  if (data == null || data === "") return null;
  const href = String(data);

  if (IMAGE_EXT_RE.test(href)) {
    const img = (
      <img
        src={href}
        alt={label}
        style={{ maxHeight: "8em", maxWidth: "100%", objectFit: "contain" }}
      />
    );
    if (ctx.viewSize && ctx.viewSize !== "detail") return img;
    return <PropertyRow label={label}>{img}</PropertyRow>;
  }

  return renderValueWithRow(props, uriFallback);
}
