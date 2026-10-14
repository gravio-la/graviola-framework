import React, { useCallback, useMemo, useState } from "react";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { Box, Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

import { PropertyRow } from "./PropertyRow";
import { shouldStackPropertyRow } from "../utils/isTopLevelSection";

function GalleryThumb({
  href,
  onOpen,
  ctx,
}: {
  href: string;
  onOpen: (href: string) => void;
  ctx: DetailRendererProps["ctx"];
}) {
  const src = useThumbnailUrl(
    href,
    { sizeCategory: "listItem" },
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
      onClick={() => onOpen(href)}
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
        src={src}
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

export function ImageGalleryRenderer({
  label,
  data,
  ctx,
}: DetailRendererProps) {
  const [lightboxHref, setLightboxHref] = useState<string | null>(null);

  const urls = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => (item == null ? "" : String(item)))
      .filter((s) => s.length > 0);
  }, [data]);

  const closeLightbox = useCallback(() => setLightboxHref(null), []);

  if (urls.length === 0) return null;

  const grid = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
        gap: 1,
        maxWidth: "100%",
      }}
    >
      {urls.map((href) => (
        <GalleryThumb
          key={href}
          href={href}
          ctx={ctx}
          onOpen={setLightboxHref}
        />
      ))}
    </Box>
  );

  return (
    <>
      <PropertyRow label={label} stacked={shouldStackPropertyRow(ctx)}>
        {grid}
      </PropertyRow>
      <Dialog
        open={lightboxHref != null}
        onClose={closeLightbox}
        maxWidth="lg"
        fullWidth
      >
        <IconButton
          aria-label="Close"
          onClick={closeLightbox}
          sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          {lightboxHref ? (
            <Box
              component="img"
              src={lightboxHref}
              alt=""
              sx={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 1,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
