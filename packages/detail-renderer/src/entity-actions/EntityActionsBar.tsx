import React, { useMemo, useState } from "react";
import { CardActions, IconButton, Menu, MenuItem, Stack } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { EntityActionDef } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";
import {
  declaredEntityActions,
  selectEntityActions,
  splitByImportance,
  type ActionSurface,
  type DetailTesterContext,
  type EntityActionEntry,
  type EntityActionTarget,
} from "@graviola/edb-detail-renderer-core";
import { useAdbContext } from "@graviola/edb-state-hooks";

import { useDetailRendererContext } from "../context";
import { DefaultActionButton } from "../renderers/card-actions/DefaultActionButton";
import { PlayableAudioActionRenderer } from "../renderers/card-actions/PlayableAudioActionRenderer";
import { defaultEntityActionRegistry } from "./defaultEntityActionRegistry";
import { useEntityActionContext } from "./useEntityActionContext";
import { useExecuteEntityAction } from "./useExecuteEntityAction";

const CUSTOM_RENDERERS: Record<
  string,
  React.ComponentType<{
    action: EntityActionDef;
    schema: JSONSchema7;
    data: unknown;
    entityIRI?: string;
  }>
> = {
  "graviola:playable-audio": PlayableAudioActionRenderer,
};

type EntityActionsBarProps = {
  surface: ActionSurface;
  declaredActions?: EntityActionDef[];
  schema: JSONSchema7;
  data: unknown;
  ctx: DetailTesterContext;
  registry?: EntityActionEntry[];
  maxVisible?: number;
  onCustomAction?: (actionId: string) => void;
};

export function EntityActionsBar({
  surface,
  declaredActions,
  schema,
  data,
  ctx,
  registry: registryProp,
  maxVisible: maxVisibleProp,
  onCustomAction,
}: EntityActionsBarProps) {
  const { config } = useDetailRendererContext();
  const adb = useAdbContext();
  const executeAction = useExecuteEntityAction();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const target: EntityActionTarget = {
    entityIRI: ctx.entityIRI,
    typeIRI: ctx.typeIRI,
    typeName: ctx.typeName,
    data,
  };

  const actionCtx = useEntityActionContext({
    surface,
    schema,
    targets: [target],
    typeName: ctx.typeName,
    typeIRI: ctx.typeIRI,
  });

  const registry = useMemo(
    () =>
      registryProp ??
      config.entityActions?.registry ??
      config.cardActions?.registry ??
      (
        (adb.entityActionRegistry as EntityActionEntry[] | undefined) ?? []
      ).concat(defaultEntityActionRegistry),
    [
      registryProp,
      config.entityActions?.registry,
      config.cardActions?.registry,
      adb.entityActionRegistry,
    ],
  );

  const maxVisible =
    maxVisibleProp ??
    config.entityActions?.maxVisible ??
    config.cardActions?.maxVisible ??
    2;

  const allActions = useMemo(() => {
    const registryActions = selectEntityActions(registry, schema, actionCtx);
    const declared = declaredEntityActions(declaredActions);
    return [...registryActions, ...declared];
  }, [declaredActions, registry, schema, actionCtx]);

  const { inline, overflow } = useMemo(
    () => splitByImportance(allActions, maxVisible),
    [allActions, maxVisible],
  );

  if (allActions.length === 0) return null;

  const runAction = (def: EntityActionDef, entryName?: string | null) => {
    if (entryName && CUSTOM_RENDERERS[entryName]) return;
    executeAction(def, target, onCustomAction);
  };

  const renderAction = (resolved: (typeof allActions)[number]) => {
    const CustomRenderer =
      resolved.entry?.name != null
        ? CUSTOM_RENDERERS[resolved.entry.name]
        : undefined;
    if (CustomRenderer) {
      return (
        <CustomRenderer
          key={resolved.def.id}
          action={resolved.def}
          schema={schema}
          data={data}
          entityIRI={ctx.entityIRI}
        />
      );
    }
    return (
      <DefaultActionButton
        key={resolved.def.id}
        action={resolved.def}
        schema={schema}
        data={data}
        entityIRI={ctx.entityIRI}
        onAction={() => runAction(resolved.def, resolved.entry?.name)}
      />
    );
  };

  return (
    <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {inline.map(renderAction)}
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
                    runAction(resolved.def, resolved.entry?.name);
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
