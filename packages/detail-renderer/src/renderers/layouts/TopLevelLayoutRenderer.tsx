import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Skeleton,
  Typography,
} from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";

function useDetailHeroImage(
  image: string | null | undefined,
  ctx: DetailRendererProps["ctx"],
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

/** Single surface: edge-to-edge hero image (rounded top), headline, subtitle, divider, properties. */
function TopLevelLayoutSingleCardHeroBleed({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout & {
    options?: { headline?: string };
  };
  const elements = layout.elements ?? [];
  const opts = layout.options;
  const headline =
    opts?.headline ?? ctx.humanLabel ?? ctx.headerPreview?.label ?? "";
  const preview = ctx.headerPreview;
  const titleText = preview?.label ?? headline;
  const desc = preview?.description;
  const img = useDetailHeroImage(preview?.image, ctx);

  return (
    <Box>
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
        <CardContent>
          {ctx.isLoading ? (
            <Skeleton variant="text" width="40%" height={36} />
          ) : (
            <Typography variant="h5" fontWeight="bold">
              {titleText ?? ctx.humanLabel ?? ""}
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

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {elements.map((el, i) => (
              <React.Fragment key={i}>
                {dispatch({ uiSchema: el, ctx })}
              </React.Fragment>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export function TopLevelLayoutRenderer(props: DetailRendererProps) {
  if (props.ctx.topLevelLayoutVariant === "singleCardPropertiesFirst") {
    return <TopLevelLayoutSingleCardHeroBleed {...props} />;
  }

  const { uiSchema, dispatch, ctx } = props;
  const layout = uiSchema as Layout & {
    options?: { headline?: string };
  };
  const elements = layout.elements ?? [];
  const opts = layout.options;
  const headline =
    opts?.headline ?? ctx.humanLabel ?? ctx.headerPreview?.label ?? "";
  const preview = ctx.headerPreview;
  const titleText = preview?.label ?? headline;
  const desc = preview?.description;
  const img = useDetailHeroImage(preview?.image, ctx);

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        {img ? (
          <CardMedia
            component="img"
            image={img}
            alt={titleText ?? ""}
            sx={{ maxHeight: "18em", objectFit: "cover" }}
          />
        ) : null}
        <CardContent>
          {ctx.isLoading ? (
            <Skeleton variant="text" width="40%" height={36} />
          ) : (
            <Typography variant="h5" fontWeight="bold">
              {titleText ?? ctx.humanLabel ?? ""}
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
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {elements.map((el, i) => (
          <React.Fragment key={i}>
            {dispatch({ uiSchema: el, ctx })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}
