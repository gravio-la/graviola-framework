import React, { useMemo } from "react";
import {
  Box,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import {
  PreviewAvatar,
  previewAvatarVisible,
} from "../../preview/PreviewAvatar";
import { useMotionAdapter } from "../../motion/MotionAdapter";
import { useEntityOpenHandlers } from "../../entity-actions/useEntityOpenHandlers";
import { motionScopeId, previewFromCtx } from "./previewFromCtx";

export function ListItemLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
  rootSchema,
  rootData,
}: DetailRendererProps) {
  const layout = uiSchema as Layout;
  const preview = previewFromCtx(ctx);
  const { Slot } = useMotionAdapter();
  const scope = motionScopeId(ctx);
  const isCondensed = ctx.density === "condensed";
  const thumbCtx = useMemo(
    () => ({
      viewSize: "listItem" as const,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    }),
    [ctx.typeName, ctx.typeIRI, ctx.entityIRI],
  );

  const openHandlers = useEntityOpenHandlers({
    surface: "listItem",
    target: {
      entityIRI: ctx.entityIRI,
      typeIRI: ctx.typeIRI,
      typeName: ctx.typeName,
      data: rootData,
    },
    schema: rootSchema,
  });

  const extra = (layout.elements ?? []).map((el, i) => (
    <React.Fragment key={i}>{dispatch({ uiSchema: el, ctx })}</React.Fragment>
  ));

  return (
    <>
      <ListItem
        alignItems="flex-start"
        disableGutters
        dense={isCondensed}
        sx={{
          cursor: ctx.entityIRI ? "pointer" : undefined,
          py: isCondensed ? 0.25 : undefined,
        }}
        onClick={ctx.entityIRI ? openHandlers.onClick : undefined}
        onAuxClick={openHandlers.onAuxClick}
        onContextMenu={openHandlers.onContextMenu}
      >
        {previewAvatarVisible(preview) ? (
          <ListItemAvatar sx={isCondensed ? { minWidth: 40 } : undefined}>
            <Slot id="image" motionId={`${scope}:image`}>
              <PreviewAvatar
                preview={preview}
                alt={preview.label}
                density={isCondensed ? "chip" : "list"}
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
            !isCondensed && preview.description ? (
              <Slot id="description" motionId={`${scope}:description`}>
                {preview.description}
              </Slot>
            ) : null
          }
        />
        <Box onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            aria-label="actions"
            onClick={openHandlers.onContextMenu}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItem>
      {openHandlers.contextMenu}
    </>
  );
}
