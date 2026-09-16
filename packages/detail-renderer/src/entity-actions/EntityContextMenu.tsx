import React, { useCallback, useMemo, useState } from "react";
import { ListSubheader, Menu, MenuItem } from "@mui/material";
import type { JSONSchema7 } from "json-schema";
import type {
  ActionSurface,
  EntityActionEntry,
  EntityActionTarget,
} from "@graviola/edb-detail-renderer-core";
import {
  declaredEntityActions,
  selectEntityActions,
} from "@graviola/edb-detail-renderer-core";
import type { EntityActionDef } from "@graviola/edb-core-types";
import { useAdbContext } from "@graviola/edb-state-hooks";

import { defaultEntityActionRegistry } from "./defaultEntityActionRegistry";
import { useEntityActionContext } from "./useEntityActionContext";
import { useExecuteEntityAction } from "./useExecuteEntityAction";

type ContextMenuState = {
  mouseX: number;
  mouseY: number;
} | null;

export function useEntityContextMenu(params: {
  surface: ActionSurface;
  schema?: JSONSchema7;
  targets: EntityActionTarget[];
  typeName?: string;
  typeIRI?: string;
  declaredActions?: EntityActionDef[];
  registry?: EntityActionEntry[];
  onCustomAction?: (actionId: string) => void;
}) {
  const {
    surface,
    schema,
    targets,
    typeName,
    typeIRI,
    declaredActions,
    registry: registryProp,
    onCustomAction,
  } = params;
  const adb = useAdbContext();
  const executeAction = useExecuteEntityAction();
  const [anchor, setAnchor] = useState<ContextMenuState>(null);

  const effectiveSchema = schema ?? ({ type: "object" } as JSONSchema7);
  const actionCtx = useEntityActionContext({
    surface,
    schema: effectiveSchema,
    targets,
    typeName,
    typeIRI,
  });

  const registry = useMemo(
    () => [
      ...(registryProp ?? []),
      ...((adb.entityActionRegistry as EntityActionEntry[] | undefined) ?? []),
      ...defaultEntityActionRegistry,
    ],
    [registryProp, adb.entityActionRegistry],
  );

  const actions = useMemo(() => {
    const fromRegistry = selectEntityActions(
      registry,
      effectiveSchema,
      actionCtx,
    );
    const declared = declaredEntityActions(declaredActions);
    return [...fromRegistry, ...declared];
  }, [registry, effectiveSchema, actionCtx, declaredActions]);

  const openContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchor({ mouseX: event.clientX, mouseY: event.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setAnchor(null), []);

  const handleAction = useCallback(
    (action: EntityActionDef) => {
      closeContextMenu();
      const target = targets[0];
      if (!target) return;
      executeAction(action, target, onCustomAction);
    },
    [closeContextMenu, executeAction, onCustomAction, targets],
  );

  const grouped = useMemo(() => {
    const sections = new Map<string | undefined, typeof actions>();
    for (const item of actions) {
      const key = item.def.section;
      const list = sections.get(key) ?? [];
      list.push(item);
      sections.set(key, list);
    }
    return sections;
  }, [actions]);

  const contextMenu =
    actions.length > 0 ? (
      <Menu
        open={anchor != null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          anchor ? { top: anchor.mouseY, left: anchor.mouseX } : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {Array.from(grouped.entries()).flatMap(([section, items]) => [
          section ? (
            <ListSubheader key={`section-${section}`}>{section}</ListSubheader>
          ) : null,
          ...items.map((item) => (
            <MenuItem
              key={item.def.id}
              onClick={() => handleAction(item.def)}
              sx={item.def.destructive ? { color: "error.main" } : undefined}
            >
              {item.def.icon ? `${item.def.icon} ` : null}
              {item.def.label}
            </MenuItem>
          )),
        ])}
      </Menu>
    ) : null;

  return { openContextMenu, closeContextMenu, contextMenu, actions };
}
