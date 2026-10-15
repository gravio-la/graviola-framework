import React, { useMemo } from "react";
import { Card, CardContent, Skeleton, Typography } from "@mui/material";
import type { PreviewImageRef } from "@graviola/edb-core-types";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

import { DetailHeroImage } from "../../components/DetailHeroImage";
import { MarkdownValueRenderer } from "../../value-renderers/MarkdownValueRenderer";
import { useOptionalDetailRendererContext } from "../../context";
import { schemaForPrimaryDescription } from "../../utils/primaryDescriptionSchema";
import type { DetailLayoutUiOptions } from "../../utils/detailLayoutOptions";

function useDetailHeroImage(
  image: PreviewImageRef | null | undefined,
  ctx: DetailTesterContext,
) {
  return useThumbnailUrl(
    image ?? undefined,
    { sizeCategory: "detail" },
    {
      viewSize: "detail",
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    },
  );
}

export type DetailHeroProps = {
  ctx: DetailTesterContext;
  /** Optional headline override (e.g. layout `options.headline`). */
  headline?: string;
  /**
   * - `card` — standalone hero card (default TopLevelLayout).
   * - `bleed` — edge-to-edge image inside a surrounding card
   *   (`singleCardPropertiesFirst`).
   * - `none` — title/subtitle only, no Card chrome (ArticleLayout).
   */
  variant?: "card" | "bleed" | "none";
  /** Extra content below the hero lede (e.g. Divider + properties). */
  children?: React.ReactNode;
  showIri?: DetailLayoutUiOptions["showIri"];
};

function PrimaryDescriptionLede({
  text,
  schema,
  ctx,
}: {
  text: string;
  schema: ReturnType<typeof schemaForPrimaryDescription>;
  ctx: DetailTesterContext;
}) {
  const isMarkdown = schema?.contentMediaType === "text/markdown";
  if (isMarkdown) {
    return (
      <Typography variant="body1" component="div" sx={{ mt: 1 }}>
        <MarkdownValueRenderer
          value={text}
          schema={schema ?? { type: "string" }}
          ctx={ctx}
        />
      </Typography>
    );
  }
  return (
    <Typography variant="body1" color="text.primary" sx={{ mt: 1 }}>
      {text}
    </Typography>
  );
}

/** Shared detail hero: image, title, description, optional entity IRI. */
export function DetailHero({
  ctx,
  headline,
  variant = "card",
  children,
  showIri = "footer",
}: DetailHeroProps) {
  const preview = ctx.headerPreview;
  const titleText = preview?.label ?? headline ?? ctx.humanLabel ?? "";
  const desc = preview?.description;
  const img = useDetailHeroImage(preview?.image, ctx);

  const detailRendererCtx = useOptionalDetailRendererContext();

  const descriptionSchema = useMemo(() => {
    if (!detailRendererCtx?.config.primaryFields || !ctx.typeName) {
      return undefined;
    }
    const pf = detailRendererCtx.config.primaryFields[ctx.typeName] as
      | { description?: string }
      | undefined;
    return schemaForPrimaryDescription(
      detailRendererCtx.rootSchema,
      pf?.description,
    );
  }, [detailRendererCtx, ctx.typeName]);

  const titleBlock = (
    <>
      {ctx.isLoading ? (
        <Skeleton variant="text" width="40%" height={36} />
      ) : (
        <Typography
          variant="h5"
          component={variant === "none" ? "h1" : "h5"}
          fontWeight="bold"
        >
          {titleText}
        </Typography>
      )}
      {desc ? (
        <PrimaryDescriptionLede
          text={desc}
          schema={descriptionSchema}
          ctx={ctx}
        />
      ) : null}
      {showIri === "title" && ctx.entityIRI ? (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 0.5, display: "block" }}
        >
          {ctx.entityIRI}
        </Typography>
      ) : null}
      {children}
    </>
  );

  const heroImageSx =
    variant === "bleed"
      ? { maxHeight: "min(42vh, 20rem)" }
      : { maxHeight: "18em" };

  if (variant === "none") {
    return <>{titleBlock}</>;
  }

  if (variant === "bleed") {
    return (
      <Card
        elevation={2}
        sx={{
          mb: 0,
          overflow: "hidden",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        {img ? (
          <DetailHeroImage src={img} alt={titleText ?? ""} sx={heroImageSx} />
        ) : null}
        <CardContent>{titleBlock}</CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      {img ? (
        <DetailHeroImage src={img} alt={titleText ?? ""} sx={heroImageSx} />
      ) : null}
      <CardContent>{titleBlock}</CardContent>
    </Card>
  );
}
