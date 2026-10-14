import React from "react";
import { Box, Divider } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { DetailHero } from "./DetailHero";
import { DetailIriFooter } from "../../components/DetailIriFooter";
import {
  detailContentMaxWidthSx,
  readDetailLayoutOptions,
} from "../../utils/detailLayoutOptions";
import { renderGroupedTopLevelElements } from "../../utils/detailTopLevelElements";

/** Single surface: edge-to-edge hero image (rounded top), headline, subtitle, divider, properties. */
function TopLevelLayoutSingleCardHeroBleed({
  uiSchema,
  dispatch,
  ctx,
  rootData,
}: DetailRendererProps) {
  const layout = uiSchema as Layout & {
    options?: { headline?: string; detail?: unknown; hero?: unknown };
  };
  const elements = layout.elements ?? [];
  const headline = layout.options?.headline;
  const detailOpts = readDetailLayoutOptions(layout.options);
  const widthSx = detailContentMaxWidthSx(
    ctx.viewSize === "detail" ? detailOpts.maxWidth : "none",
  );

  return (
    <Box sx={widthSx}>
      <DetailHero
        ctx={ctx}
        headline={headline}
        variant="bleed"
        showIri={detailOpts.showIri}
      >
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {renderGroupedTopLevelElements(
            layout,
            elements,
            dispatch,
            ctx,
            rootData,
          )}
        </Box>
        {detailOpts.showIri === "footer" ? (
          <DetailIriFooter entityIRI={ctx.entityIRI} />
        ) : null}
      </DetailHero>
    </Box>
  );
}

export function TopLevelLayoutRenderer(props: DetailRendererProps) {
  if (props.ctx.topLevelLayoutVariant === "singleCardPropertiesFirst") {
    return <TopLevelLayoutSingleCardHeroBleed {...props} />;
  }

  const { uiSchema, dispatch, ctx, rootData } = props;
  const layout = uiSchema as Layout & {
    options?: { headline?: string; detail?: unknown; hero?: unknown };
  };
  const elements = layout.elements ?? [];
  const headline = layout.options?.headline;
  const detailOpts = readDetailLayoutOptions(layout.options);
  const widthSx = detailContentMaxWidthSx(
    ctx.viewSize === "detail" ? detailOpts.maxWidth : "none",
  );

  return (
    <Box sx={widthSx}>
      <DetailHero
        ctx={ctx}
        headline={headline}
        variant="card"
        showIri={detailOpts.showIri}
      />
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {renderGroupedTopLevelElements(
          layout,
          elements,
          dispatch,
          ctx,
          rootData,
        )}
      </Box>
      {detailOpts.showIri === "footer" ? (
        <DetailIriFooter entityIRI={ctx.entityIRI} />
      ) : null}
    </Box>
  );
}
