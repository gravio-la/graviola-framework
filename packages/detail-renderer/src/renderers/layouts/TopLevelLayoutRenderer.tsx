import React from "react";
import { Box, Divider } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { DetailHero } from "./DetailHero";

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
  const headline = layout.options?.headline;

  return (
    <Box>
      <DetailHero ctx={ctx} headline={headline} variant="bleed">
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {elements.map((el, i) => (
            <React.Fragment key={i}>
              {dispatch({ uiSchema: el, ctx })}
            </React.Fragment>
          ))}
        </Box>
      </DetailHero>
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
  const headline = layout.options?.headline;

  return (
    <Box>
      <DetailHero ctx={ctx} headline={headline} variant="card" />
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
