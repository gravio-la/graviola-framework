import React, { useCallback, useMemo, useState } from "react";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { Box } from "@mui/material";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

import { PropertyRow } from "../renderers/PropertyRow";
import { shouldStackPropertyRow } from "../utils/isTopLevelSection";
import { assetIriFromValue } from "../utils/assetValueUtils";
import { AssetLightbox } from "./AssetValueRenderer";

function GalleryThumb({
  iri,
  onOpen,
  ctx,
}: {
  iri: string;
  onOpen: (iri: string) => void;
  ctx: DetailRendererProps["ctx"];
}) {
  const listSrc = useThumbnailUrl(
    iri,
    { sizeCategory: "listItem" },
    {
      viewSize: ctx.viewSize,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    },
  );
  const cardSrc = useThumbnailUrl(
    iri,
    { sizeCategory: "card" },
    {
      viewSize: ctx.viewSize,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    },
  );

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(iri)}
      sx={{
        border: "none",
        p: 0,
        cursor: "pointer",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "action.hover",
        lineHeight: 0,
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
      }}
    >
      <Box
        component="img"
        src={listSrc}
        srcSet={cardSrc && cardSrc !== listSrc ? `${cardSrc} 480w` : undefined}
        sizes="(max-width: 600px) 88px, 160px"
        alt=""
        loading="lazy"
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          aspectRatio: "1",
        }}
      />
    </Box>
  );
}

export function AssetGalleryValueRenderer({
  label,
  data,
  ctx,
}: DetailRendererProps) {
  const iris = useMemo(() => {
    if (!Array.isArray(data)) return [] as string[];
    return data
      .map((item) => assetIriFromValue(item))
      .filter((s): s is string => typeof s === "string" && s.length > 0);
  }, [data]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openAt = useCallback(
    (iri: string) => {
      const idx = iris.indexOf(iri);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [iris],
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  if (iris.length === 0) return null;

  const activeIri = lightboxIndex != null ? iris[lightboxIndex] : undefined;

  const grid = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
        gap: 1,
        maxWidth: "100%",
      }}
    >
      {iris.map((iri) => (
        <GalleryThumb key={iri} iri={iri} ctx={ctx} onOpen={openAt} />
      ))}
    </Box>
  );

  return (
    <>
      <PropertyRow label={label} stacked={shouldStackPropertyRow(ctx)}>
        {grid}
      </PropertyRow>
      {activeIri != null && lightboxIndex != null ? (
        <AssetLightbox
          open
          onClose={closeLightbox}
          iri={activeIri}
          ctx={ctx}
          gallery={{
            items: iris,
            index: lightboxIndex,
            onIndexChange: setLightboxIndex,
          }}
        />
      ) : null}
    </>
  );
}
