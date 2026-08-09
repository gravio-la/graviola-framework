import React, { useMemo } from "react";
import type { ThumbnailSizeCategory } from "@graviola/edb-core-types";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

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
    return <UriImageThumb href={href} label={label} ctx={ctx} />;
  }

  return renderValueWithRow(props, uriFallback);
}

function UriImageThumb({
  href,
  label,
  ctx,
}: {
  href: string;
  label: string;
  ctx: DetailRendererProps["ctx"];
}) {
  const category = useMemo((): ThumbnailSizeCategory => {
    const vs = ctx.viewSize;
    if (
      vs === "chip" ||
      vs === "listItem" ||
      vs === "card" ||
      vs === "detail"
    ) {
      return vs;
    }
    return "listItem";
  }, [ctx.viewSize]);
  const src = useThumbnailUrl(
    href,
    { sizeCategory: category },
    {
      viewSize: ctx.viewSize,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    },
  );
  const img = (
    <img
      src={src}
      alt={label}
      style={{ maxHeight: "8em", maxWidth: "100%", objectFit: "contain" }}
    />
  );
  if (ctx.viewSize && ctx.viewSize !== "detail") return img;
  return <PropertyRow label={label}>{img}</PropertyRow>;
}
