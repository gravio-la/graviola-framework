import React, { useMemo } from "react";
import { ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import {
  PreviewAvatar,
  previewAvatarVisible,
} from "../../preview/PreviewAvatar";
import { useMotionAdapter } from "../../motion/MotionAdapter";
import { motionScopeId, previewFromCtx } from "./previewFromCtx";

export function ListItemLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
}: DetailRendererProps) {
  const layout = uiSchema as Layout;
  const preview = previewFromCtx(ctx);
  const { Slot } = useMotionAdapter();
  const scope = motionScopeId(ctx);
  const thumbCtx = useMemo(
    () => ({
      viewSize: "listItem" as const,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    }),
    [ctx.typeName, ctx.typeIRI, ctx.entityIRI],
  );

  const extra = (layout.elements ?? []).map((el, i) => (
    <React.Fragment key={i}>{dispatch({ uiSchema: el, ctx })}</React.Fragment>
  ));

  return (
    <ListItem alignItems="flex-start" disableGutters>
      {previewAvatarVisible(preview) ? (
        <ListItemAvatar>
          <Slot id="image" motionId={`${scope}:image`}>
            <PreviewAvatar
              preview={preview}
              alt={preview.label}
              density="list"
              thumbnailContext={thumbCtx}
            />
          </Slot>
        </ListItemAvatar>
      ) : null}
      <ListItemText
        primary={
          <Slot id="label" motionId={`${scope}:label`}>
            {preview.label ?? ctx.humanLabel ?? extra}
          </Slot>
        }
        secondary={
          preview.description ? (
            <Slot id="description" motionId={`${scope}:description`}>
              {preview.description}
            </Slot>
          ) : null
        }
      />
    </ListItem>
  );
}
