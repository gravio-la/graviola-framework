import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Typography,
} from "@mui/material";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

function useDetailHeroImage(
  image: string | null | undefined,
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
  /** Extra content below the entity IRI (e.g. Divider + properties). */
  children?: React.ReactNode;
};

/** Shared detail hero: image, title, description, optional entity IRI. */
export function DetailHero({
  ctx,
  headline,
  variant = "card",
  children,
}: DetailHeroProps) {
  const preview = ctx.headerPreview;
  const titleText = preview?.label ?? headline ?? ctx.humanLabel ?? "";
  const desc = preview?.description;
  const img = useDetailHeroImage(preview?.image, ctx);

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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {desc}
        </Typography>
      ) : null}
      {ctx.entityIRI ? (
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
          <CardMedia
            component="img"
            image={img}
            alt={titleText ?? ""}
            sx={{
              width: "100%",
              display: "block",
              maxHeight: "min(42vh, 20rem)",
              objectFit: "cover",
            }}
          />
        ) : null}
        <CardContent>{titleBlock}</CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      {img ? (
        <CardMedia
          component="img"
          image={img}
          alt={titleText ?? ""}
          sx={{ maxHeight: "18em", objectFit: "cover" }}
        />
      ) : null}
      <CardContent>{titleBlock}</CardContent>
    </Card>
  );
}
