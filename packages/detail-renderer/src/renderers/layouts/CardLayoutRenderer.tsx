import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardMedia,
  Collapse,
  IconButton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Layout } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import type { CardActionDef, CardPresentation } from "@graviola/edb-core-types";

import { PreviewAvatar } from "../../preview/PreviewAvatar";
import { useDetailRendererContext } from "../../context";
import { useEntityRefClickHandler } from "../../hooks/useEntityRefClickHandler";
import { useMotionAdapter } from "../../motion/MotionAdapter";
import { CardActionsBar } from "../card-actions/CardActionsBar";
import { motionScopeId, previewFromCtx } from "./previewFromCtx";
import {
  CARD_SIZE_TOKENS,
  formatStatValue,
  isSecondaryControl,
  readCardPresentation,
  readPropertyString,
  secondaryFieldNamesFromPresentation,
  statLabelForField,
  type CardLayoutUiSchema,
} from "./cardLayoutHelpers";

function CardStatsStrip({
  schema,
  data,
  fieldNames,
}: {
  schema: DetailRendererProps["schema"];
  data: unknown;
  fieldNames: string[];
}) {
  if (fieldNames.length === 0) return null;
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
      {fieldNames.map((name) => {
        const value = (data as Record<string, unknown> | undefined)?.[name];
        return (
          <Box
            key={name}
            sx={(theme) => ({
              flex: 1,
              textAlign: "center",
              py: 1.25,
              px: 0.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.common.white, 0.06),
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            })}
          >
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {formatStatValue(value)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {statLabelForField(schema, name)}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

export function CardLayoutRenderer({
  uiSchema,
  dispatch,
  ctx,
  rootSchema,
  rootData,
}: DetailRendererProps) {
  const layout = uiSchema as CardLayoutUiSchema;
  const preview = previewFromCtx(ctx);
  const { Slot } = useMotionAdapter();
  const scope = motionScopeId(ctx);
  const { config } = useDetailRendererContext();
  const createEntityClick = useEntityRefClickHandler();
  const [expanded, setExpanded] = useState(false);

  const presentation = readCardPresentation(
    layout,
    config.cardPresentation as CardPresentation | undefined,
  );

  const sizeKey = presentation.size ?? "standard";
  const tokens = CARD_SIZE_TOKENS[sizeKey];
  const orientation = presentation.orientation ?? "vertical";
  const variant = presentation.variant ?? "elevated";
  const aspectRatio = presentation.mediaAspectRatio ?? "16 / 9";
  const bannerUrl = readPropertyString(rootData, presentation.banner);
  const heroImage = bannerUrl ?? preview.image;
  const isProfileLayout = Boolean(presentation.banner);
  const secondaryDisplay = presentation.secondaryDisplay ?? "inline";
  const secondaryFieldNames = secondaryFieldNamesFromPresentation(
    presentation,
    rootSchema,
  );

  const elements = layout.elements ?? [];
  const secondaryElements = useMemo(
    () => elements.filter(isSecondaryControl),
    [elements],
  );

  const secondaryBody = secondaryElements.map((el, i) => (
    <React.Fragment key={i}>{dispatch({ uiSchema: el, ctx })}</React.Fragment>
  ));

  const handleCardAction = (action: CardActionDef) => {
    const actionCtx = {
      entityIRI: ctx.entityIRI,
      typeIRI: ctx.typeIRI,
      typeName: ctx.typeName,
      data: rootData,
    };
    if (action.intent === "show" && ctx.entityIRI) {
      createEntityClick(ctx.entityIRI, ctx.typeIRI, rootData)();
      return;
    }
    if (action.intent === "edit" && ctx.entityIRI) {
      createEntityClick(ctx.entityIRI, ctx.typeIRI, rootData)();
      return;
    }
    config.onCardAction?.(action.id, actionCtx);
  };

  const cardClick =
    ctx.entityIRI != null
      ? createEntityClick(ctx.entityIRI, ctx.typeIRI, rootData)
      : undefined;

  const title = preview.label ?? ctx.humanLabel ?? "";
  const subtitle = preview.description;

  const cardSx = {
    display: "flex",
    flexDirection:
      orientation === "horizontal" ? ("row" as const) : ("column" as const),
    borderRadius: `${tokens.borderRadius}px`,
    overflow: "hidden",
    height: "100%",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    ...(variant === "filled"
      ? {
          bgcolor: "action.hover",
          boxShadow: "none",
        }
      : variant === "outlined"
        ? {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
          }
        : {
            bgcolor: "background.paper",
          }),
    ...(cardClick
      ? {
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 8,
          },
        }
      : {}),
  };

  const mediaBlock = heroImage ? (
    <Box
      sx={{
        position: "relative",
        flexShrink: 0,
        width: orientation === "horizontal" ? "38%" : "100%",
        minWidth: orientation === "horizontal" ? 120 : undefined,
      }}
    >
      <Slot id="image" motionId={`${scope}:image`}>
        <CardMedia
          component="img"
          image={heroImage}
          alt={title}
          sx={{
            width: "100%",
            aspectRatio,
            objectFit: "cover",
            display: "block",
          }}
        />
      </Slot>
      {presentation.mediaOverlay ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 2,
          }}
        >
          <Slot id="label" motionId={`${scope}:label`}>
            <Typography
              variant={tokens.titleVariant}
              fontWeight={700}
              color="common.white"
              lineHeight={1.2}
            >
              {title}
            </Typography>
          </Slot>
          {subtitle ? (
            <Slot id="description" motionId={`${scope}:description`}>
              <Typography
                variant="body2"
                sx={{ color: alpha("#fff", 0.85), mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            </Slot>
          ) : null}
        </Box>
      ) : null}
    </Box>
  ) : null;

  const textBlock = (
    <Box
      sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
    >
      <CardContent
        sx={{
          flex: 1,
          py: tokens.contentPy,
          px: tokens.contentPx,
          ...(isProfileLayout ? { pt: 0 } : undefined),
        }}
      >
        {isProfileLayout ? (
          <Box sx={{ mt: -4, mb: 1 }}>
            <Slot id="avatar" motionId={`${scope}:avatar`}>
              <Avatar
                src={preview.image}
                alt={title}
                sx={{
                  width: 72,
                  height: 72,
                  border: 3,
                  borderColor: "background.paper",
                  boxShadow: 2,
                }}
              >
                {!preview.image && title ? title.charAt(0) : null}
              </Avatar>
            </Slot>
          </Box>
        ) : null}

        {!presentation.mediaOverlay ? (
          <>
            {!isProfileLayout &&
            !heroImage &&
            preview.displayMedia !== "none" ? (
              <Box sx={{ mb: 1.5 }}>
                <PreviewAvatar preview={preview} alt={title} density="list" />
              </Box>
            ) : null}
            <Slot id="label" motionId={`${scope}:label`}>
              <Typography
                variant={tokens.titleVariant}
                fontWeight={700}
                lineHeight={1.25}
              >
                {title}
              </Typography>
            </Slot>
            {subtitle ? (
              <Slot id="description" motionId={`${scope}:description`}>
                <Typography
                  variant={tokens.subVariant}
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                >
                  {subtitle}
                </Typography>
              </Slot>
            ) : null}
          </>
        ) : null}

        {secondaryDisplay === "stats" ? (
          <CardStatsStrip
            schema={rootSchema}
            data={rootData}
            fieldNames={secondaryFieldNames}
          />
        ) : null}

        {!presentation.expandable && secondaryDisplay === "inline" ? (
          <Box sx={{ mt: subtitle || presentation.mediaOverlay ? 1.5 : 0 }}>
            <Slot id="body" motionId={`${scope}:body`}>
              {secondaryBody}
            </Slot>
          </Box>
        ) : null}
      </CardContent>

      {presentation.expandable ? (
        <>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent
              sx={{ pt: 0, px: tokens.contentPx, pb: tokens.contentPy }}
            >
              <Slot id="expand-body" motionId={`${scope}:expand`}>
                {secondaryDisplay === "inline" ? secondaryBody : null}
              </Slot>
            </CardContent>
          </Collapse>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", px: 1, pb: 0.5 }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              aria-expanded={expanded}
              aria-label="show more"
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </>
      ) : null}

      <CardActionsBar
        declaredActions={presentation.actions}
        schema={rootSchema}
        data={rootData}
        ctx={ctx}
        onDeclaredIntent={handleCardAction}
        onCustomAction={handleCardAction}
      />
    </Box>
  );

  return (
    <Card
      elevation={variant === "elevated" ? 2 : 0}
      sx={cardSx}
      onClick={cardClick}
      role={cardClick ? "button" : undefined}
      tabIndex={cardClick ? 0 : undefined}
      onKeyDown={
        cardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                cardClick();
              }
            }
          : undefined
      }
    >
      {orientation === "horizontal" ? (
        <>
          {mediaBlock}
          {textBlock}
        </>
      ) : (
        <>
          {mediaBlock}
          {textBlock}
        </>
      )}
    </Card>
  );
}
