import React, { useCallback, useMemo, useState } from "react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";
import { useAssetService, useThumbnailUrl } from "@graviola/edb-state-hooks";

import {
  assetIriFromValue,
  assetKindForValueSchema,
  formatBytes,
  genericAssetLabel,
  readAssetInlineMeta,
} from "../utils/assetValueUtils";

function thumbSizeCategory(ctx: ValueRendererProps["ctx"]) {
  const viewSize = ctx.viewSize;
  if (viewSize === "chip" || viewSize === "listItem") {
    return "listItem" as const;
  }
  return "card" as const;
}

function thumbnailContext(ctx: ValueRendererProps["ctx"]) {
  return {
    viewSize: ctx.viewSize,
    typeName: ctx.typeName,
    typeIRI: ctx.typeIRI,
    entityIRI: ctx.entityIRI,
  };
}

type LightboxProps = {
  open: boolean;
  onClose: () => void;
  iri: string;
  caption?: string;
  ctx: ValueRendererProps["ctx"];
  originalUrl?: string;
  gallery?: {
    items: string[];
    index: number;
    onIndexChange: (i: number) => void;
  };
};

function AssetLightbox({
  open,
  onClose,
  iri,
  caption,
  ctx,
  originalUrl,
  gallery,
}: LightboxProps) {
  const assetService = useAssetService();
  const thumbCtx = thumbnailContext(ctx);
  const detailSrc = useThumbnailUrl(
    iri,
    { sizeCategory: "detail" },
    { ...thumbCtx, viewSize: "detail" },
  );
  const fullFromHook = useThumbnailUrl(iri, { sizeCategory: "full" }, thumbCtx);
  const fullSrc = assetService?.thumbnailUrl(iri, "full") ?? fullFromHook;

  const showNav = gallery && gallery.items.length > 1;
  const goPrev = useCallback(() => {
    if (!gallery) return;
    const next =
      (gallery.index - 1 + gallery.items.length) % gallery.items.length;
    gallery.onIndexChange(next);
  }, [gallery]);
  const goNext = useCallback(() => {
    if (!gallery) return;
    const next = (gallery.index + 1) % gallery.items.length;
    gallery.onIndexChange(next);
  }, [gallery]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      {showNav ? (
        <>
          <IconButton
            aria-label="Previous"
            onClick={goPrev}
            sx={{ position: "absolute", left: 8, top: "50%", zIndex: 1 }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Next"
            onClick={goNext}
            sx={{ position: "absolute", right: 48, top: "50%", zIndex: 1 }}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      ) : null}
      <DialogContent
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        {detailSrc ? (
          <Box
            component="img"
            src={detailSrc}
            srcSet={
              fullSrc && fullSrc !== detailSrc ? `${fullSrc} 2x` : undefined
            }
            alt={caption ?? ""}
            sx={{
              maxWidth: "100%",
              maxHeight: "75vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
        ) : null}
        {caption ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {caption}
          </Typography>
        ) : null}
        {originalUrl ? (
          <Link href={originalUrl} target="_blank" rel="noopener noreferrer">
            Open original
          </Link>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FileAssetTile({
  iri,
  meta,
  ctx,
  onOpenLightbox,
}: {
  iri: string;
  meta: ReturnType<typeof readAssetInlineMeta>;
  ctx: ValueRendererProps["ctx"];
  onOpenLightbox?: () => void;
}) {
  const assetService = useAssetService();
  const thumbCategory = thumbSizeCategory(ctx);
  const encodingFormat = meta.encodingFormat;
  const isPdf =
    encodingFormat === "application/pdf" || encodingFormat === undefined;
  const showThumb = isPdf || encodingFormat?.startsWith("image/");
  const thumbSrc = useThumbnailUrl(
    showThumb ? iri : undefined,
    { sizeCategory: thumbCategory },
    thumbnailContext(ctx),
  );
  const [thumbFailed, setThumbFailed] = useState(false);
  const originalUrl = assetService?.originalUrl(iri);
  const label = genericAssetLabel(iri, meta);
  const Icon = isPdf ? PictureAsPdfIcon : InsertDriveFileIcon;

  return (
    <Stack spacing={1} sx={{ maxWidth: "100%" }}>
      {showThumb && thumbSrc && !thumbFailed ? (
        <Box
          component="button"
          type="button"
          onClick={onOpenLightbox}
          disabled={!onOpenLightbox}
          sx={{
            border: "none",
            p: 0,
            cursor: onOpenLightbox ? "pointer" : "default",
            borderRadius: 1,
            overflow: "hidden",
            lineHeight: 0,
            maxWidth: 320,
          }}
        >
          <Box
            component="img"
            src={thumbSrc}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            sx={{
              display: "block",
              width: "100%",
              maxHeight: 160,
              objectFit: "cover",
            }}
          />
        </Box>
      ) : null}
      <Chip
        icon={<Icon fontSize="small" />}
        label={
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap component="span">
              {label}
            </Typography>
            {meta.contentSize != null ? (
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                {formatBytes(meta.contentSize)}
              </Typography>
            ) : null}
          </Box>
        }
        component={originalUrl ? "a" : "div"}
        {...(originalUrl
          ? {
              href: originalUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              clickable: true,
            }
          : {})}
        sx={{ height: "auto", py: 0.5, maxWidth: "100%" }}
      />
    </Stack>
  );
}

function ImageAssetThumb({
  iri,
  meta,
  ctx,
  onOpen,
}: {
  iri: string;
  meta: ReturnType<typeof readAssetInlineMeta>;
  ctx: ValueRendererProps["ctx"];
  onOpen: () => void;
}) {
  const thumbCategory = thumbSizeCategory(ctx);
  const src = useThumbnailUrl(
    iri,
    { sizeCategory: thumbCategory },
    thumbnailContext(ctx),
  );
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Typography variant="body2" color="text.secondary">
        {genericAssetLabel(iri, meta)}
      </Typography>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        border: "none",
        p: 0,
        cursor: "pointer",
        borderRadius: 1,
        overflow: "hidden",
        lineHeight: 0,
        maxWidth: thumbCategory === "listItem" ? 96 : 480,
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
      }}
    >
      <Box
        component="img"
        src={src}
        alt={meta.fileName ?? ""}
        loading="lazy"
        onError={() => setFailed(true)}
        sx={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: thumbCategory === "listItem" ? 96 : 320,
          objectFit: "cover",
        }}
      />
    </Box>
  );
}

export function AssetValueRenderer({ value, schema, ctx }: ValueRendererProps) {
  const iri = assetIriFromValue(value);
  const kind = assetKindForValueSchema(schema, ctx) ?? "file";
  const meta = readAssetInlineMeta(value);
  const assetService = useAssetService();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const originalUrl = useMemo(
    () => (iri ? assetService?.originalUrl(iri) : undefined),
    [assetService, iri],
  );

  if (!iri) return null;

  if (kind === "file") {
    const openLightbox =
      meta.encodingFormat === "application/pdf" ||
      meta.encodingFormat?.startsWith("image/") ||
      meta.encodingFormat === undefined
        ? () => setLightboxOpen(true)
        : undefined;
    return (
      <>
        <FileAssetTile
          iri={iri}
          meta={meta}
          ctx={ctx}
          onOpenLightbox={openLightbox}
        />
        {lightboxOpen ? (
          <AssetLightbox
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            iri={iri}
            caption={meta.caption}
            ctx={ctx}
            originalUrl={originalUrl}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <ImageAssetThumb
        iri={iri}
        meta={meta}
        ctx={ctx}
        onOpen={() => setLightboxOpen(true)}
      />
      <AssetLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        iri={iri}
        caption={meta.caption}
        ctx={ctx}
        originalUrl={originalUrl}
      />
    </>
  );
}

export { AssetLightbox };
