import React, { useMemo, useState } from "react";
import { CardActions, IconButton, Menu, MenuItem, Stack } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { CardActionDef } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";
import {
  declaredCardActions,
  selectCardActions,
  type CardActionsConfig,
  type DetailTesterContext,
  type ResolvedCardAction,
} from "@graviola/edb-detail-renderer-core";

import { useDetailRendererContext } from "../../context";
import { DefaultActionButton } from "./DefaultActionButton";
import { defaultCardActionRegistry } from "./defaultCardActionRegistry";

type CardActionsBarProps = {
  declaredActions?: CardActionDef[];
  schema: JSONSchema7;
  data: unknown;
  ctx: DetailTesterContext;
  onDeclaredIntent: (action: CardActionDef) => void;
  onCustomAction: (action: CardActionDef) => void;
  cardActionsConfig?: CardActionsConfig;
};

function ActionButton({
  resolved,
  schema,
  data,
  entityIRI,
  onDeclaredIntent,
  onCustomAction,
}: {
  resolved: ResolvedCardAction;
  schema: JSONSchema7;
  data: unknown;
  entityIRI?: string;
  onDeclaredIntent: (action: CardActionDef) => void;
  onCustomAction: (action: CardActionDef) => void;
}) {
  if (resolved.entry?.renderer) {
    const CustomRenderer = resolved.entry.renderer;
    return (
      <CustomRenderer
        action={resolved.def}
        schema={schema}
        data={data}
        entityIRI={entityIRI}
      />
    );
  }

  return (
    <DefaultActionButton
      action={resolved.def}
      schema={schema}
      data={data}
      entityIRI={entityIRI}
      onShowEdit={() => onDeclaredIntent(resolved.def)}
      onCustom={() => onCustomAction(resolved.def)}
    />
  );
}

export function CardActionsBar({
  declaredActions,
  schema,
  data,
  ctx,
  onDeclaredIntent,
  onCustomAction,
  cardActionsConfig,
}: CardActionsBarProps) {
  const { config } = useDetailRendererContext();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const registry =
    cardActionsConfig?.registry ??
    config.cardActions?.registry ??
    defaultCardActionRegistry;
  const maxVisible =
    cardActionsConfig?.maxVisible ?? config.cardActions?.maxVisible ?? 2;

  const allActions = useMemo(() => {
    const registryActions = selectCardActions(registry, schema, data, ctx);
    const declared = declaredCardActions(declaredActions);
    return [...registryActions, ...declared];
  }, [declaredActions, registry, schema, data, ctx]);

  if (allActions.length === 0) return null;

  const visible = allActions.slice(0, maxVisible);
  const overflow = allActions.slice(maxVisible);

  const renderProps = {
    schema,
    data,
    entityIRI: ctx.entityIRI,
    onDeclaredIntent,
    onCustomAction,
  };

  return (
    <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {visible.map((resolved) => (
          <ActionButton
            key={resolved.def.id}
            resolved={resolved}
            {...renderProps}
          />
        ))}
        {overflow.length > 0 ? (
          <>
            <IconButton
              size="small"
              aria-label="more actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              onClick={(e) => e.stopPropagation()}
            >
              {overflow.map((resolved) => (
                <MenuItem
                  key={resolved.def.id}
                  onClick={() => {
                    setMenuAnchor(null);
                    if (resolved.entry?.renderer) return;
                    if (
                      resolved.def.intent === "show" ||
                      resolved.def.intent === "edit"
                    ) {
                      onDeclaredIntent(resolved.def);
                    } else {
                      onCustomAction(resolved.def);
                    }
                  }}
                >
                  {resolved.def.icon ? `${resolved.def.icon} ` : null}
                  {resolved.def.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : null}
      </Stack>
    </CardActions>
  );
}
