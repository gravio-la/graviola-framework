import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Avatar,
} from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { useMotionAdapter } from "../../motion/MotionAdapter";
import { motionScopeId, previewFromCtx } from "./previewFromCtx";

export function CardLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout;
  const preview = previewFromCtx(ctx);
  const { Slot } = useMotionAdapter();
  const scope = motionScopeId(ctx);

  const body = (layout.elements ?? []).map((el, i) => (
    <React.Fragment key={i}>{dispatch({ uiSchema: el, ctx })}</React.Fragment>
  ));

  return (
    <Card sx={{ aspectRatio: "4/3", display: "flex", flexDirection: "column" }}>
      {preview.image ? (
        <Slot id="image" motionId={`${scope}:image`}>
          <CardMedia
            component="img"
            image={preview.image}
            alt={preview.label ?? ""}
            sx={{ objectFit: "cover", maxHeight: 160 }}
          />
        </Slot>
      ) : null}
      <CardHeader
        avatar={
          !preview.image && preview.label ? (
            <Avatar>{preview.label.charAt(0)}</Avatar>
          ) : undefined
        }
        title={
          <Slot id="label" motionId={`${scope}:label`}>
            {preview.label ?? ctx.humanLabel}
          </Slot>
        }
        subheader={
          preview.description ? (
            <Slot id="description" motionId={`${scope}:description`}>
              {preview.description}
            </Slot>
          ) : undefined
        }
      />
      {body.length > 0 ? (
        <CardContent>
          <Slot id="body" motionId={`${scope}:body`}>
            {body}
          </Slot>
        </CardContent>
      ) : null}
    </Card>
  );
}
