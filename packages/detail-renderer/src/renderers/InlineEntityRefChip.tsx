import React, { useMemo } from "react";
import { Avatar, Chip } from "@mui/material";
import { extractEntityPreview } from "@graviola/edb-core-utils";

import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { useDetailRendererContext } from "../context";

/** Compact linked-entity chip without loading from store (uses embedded ref data). */
export function InlineEntityRefChip({
  data,
  ctx,
  onClick,
}: {
  data: Record<string, unknown>;
  ctx: DetailRendererProps["ctx"];
  onClick?: () => void;
}) {
  const { config } = useDetailRendererContext();
  const typeIRI =
    (typeof data["@type"] === "string" ? data["@type"] : undefined) ??
    ctx.typeIRI;
  const typeName = useMemo(
    () => (typeIRI && ctx.typeIRIToTypeName?.(typeIRI)) ?? ctx.typeName,
    [typeIRI, ctx.typeIRIToTypeName, ctx.typeName],
  );
  const preview = extractEntityPreview({
    data,
    typeName,
    primaryFields: config.primaryFields,
  });
  const label =
    preview.label ??
    (typeof data.__label === "string" ? data.__label : undefined) ??
    (typeof data.name === "string" ? data.name : undefined) ??
    (typeof data.realmName === "string" ? data.realmName : undefined) ??
    (typeof data.documentTitle === "string" ? data.documentTitle : undefined) ??
    String(data["@id"] ?? "");

  return (
    <Chip
      size="small"
      onClick={onClick}
      clickable={Boolean(onClick)}
      avatar={
        preview.image ? <Avatar src={preview.image} alt={label} /> : undefined
      }
      label={label}
    />
  );
}
