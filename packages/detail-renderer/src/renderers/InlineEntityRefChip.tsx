import React, { useMemo } from "react";
import { Chip, Link } from "@mui/material";
import { extractEntityPreview } from "@graviola/edb-core-utils";

import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { useDetailRendererContext } from "../context";
import { PreviewAvatar } from "../preview/PreviewAvatar";

/** Compact linked-entity chip without loading from store (uses embedded ref data). */
export function InlineEntityRefChip({
  data,
  ctx,
  onClick,
  presentation = "chip",
  hideAvatar = false,
}: {
  data: Record<string, unknown>;
  ctx: DetailRendererProps["ctx"];
  onClick?: () => void;
  presentation?: "chip" | "textLink";
  hideAvatar?: boolean;
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
  const entityIRI =
    typeof data["@id"] === "string" ? data["@id"] : ctx.entityIRI;
  const thumbCtx = useMemo(
    () => ({
      viewSize: "chip" as const,
      typeName,
      typeIRI,
      entityIRI,
      data,
    }),
    [typeName, typeIRI, entityIRI, data],
  );

  if (presentation === "textLink") {
    return (
      <Link
        component="button"
        type="button"
        variant="body2"
        underline="hover"
        onClick={onClick}
        disabled={!onClick}
        sx={{
          verticalAlign: "baseline",
          fontWeight: "inherit",
          p: 0,
          minWidth: 0,
          textAlign: "left",
        }}
        className="graviola-detail-compact-entity-link"
      >
        {label}
      </Link>
    );
  }

  return (
    <Chip
      size="small"
      onClick={onClick}
      clickable={Boolean(onClick)}
      avatar={
        !hideAvatar && preview.image ? (
          <PreviewAvatar
            preview={preview}
            alt={label}
            density="chip"
            thumbnailContext={thumbCtx}
          />
        ) : undefined
      }
      label={label}
    />
  );
}
