import React, { useMemo } from "react";
import { Chip } from "@mui/material";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import {
  previewChipAvatar,
  previewChipIcon,
} from "../../preview/PreviewAvatar";
import { useMotionAdapter } from "../../motion/MotionAdapter";
import { useEntityOpenHandlers } from "../../entity-actions/useEntityOpenHandlers";
import { motionScopeId, previewFromCtx } from "./previewFromCtx";

export function ChipLayoutRenderer({
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
  const thumbCtx = useMemo(
    () => ({
      viewSize: "chip" as const,
      typeName: ctx.typeName,
      typeIRI: ctx.typeIRI,
      entityIRI: ctx.entityIRI,
    }),
    [ctx.typeName, ctx.typeIRI, ctx.entityIRI],
  );

  const openHandlers = useEntityOpenHandlers({
    surface: "chip",
    target: {
      entityIRI: ctx.entityIRI,
      typeIRI: ctx.typeIRI,
      typeName: ctx.typeName,
      data: rootData,
    },
    schema: rootSchema,
  });

  const body = (layout.elements ?? []).map((el, i) => (
    <React.Fragment key={i}>{dispatch({ uiSchema: el, ctx })}</React.Fragment>
  ));

  const label = preview.label ?? ctx.humanLabel ?? "";
  const color =
    (preview.color as "default" | "primary" | "secondary" | undefined) ??
    "default";
  const chipIcon = previewChipIcon(preview);
  const chipAvatar = previewChipAvatar(preview, label, thumbCtx);

  return (
    <>
      <Slot id="body" motionId={`${scope}:body`}>
        <Chip
          size="small"
          color={color === "default" ? undefined : color}
          icon={chipIcon as React.ReactElement | undefined}
          avatar={chipAvatar}
          onClick={ctx.entityIRI ? openHandlers.onClick : undefined}
          onAuxClick={openHandlers.onAuxClick}
          onContextMenu={openHandlers.onContextMenu}
          label={
            <Slot id="label" motionId={`${scope}:label`}>
              {label || body}
            </Slot>
          }
        />
      </Slot>
      {openHandlers.contextMenu}
    </>
  );
}
