import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import type {
  ActionSurface,
  EntityActionTarget,
} from "@graviola/edb-detail-renderer-core";
import {
  MODAL_ENTITY_DETAIL,
  useDispatchIntent,
  useGraviolaModal,
  useHostCapabilities,
} from "@graviola/edb-state-hooks";

import { useEntityContextMenu } from "./EntityContextMenu";

export function useEntityOpenHandlers(params: {
  surface: ActionSurface;
  target: EntityActionTarget;
  schema?: import("json-schema").JSONSchema7;
  onCustomAction?: (actionId: string) => void;
}) {
  const { target, onCustomAction } = params;
  const dispatchIntent = useDispatchIntent();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);
  const capabilities = useHostCapabilities();
  const { openContextMenu, contextMenu } = useEntityContextMenu({
    ...params,
    targets: [target],
  });

  const openModal = useCallback(() => {
    if (!target.entityIRI) return;
    void detailModal.show(
      {
        entityIRI: target.entityIRI,
        typeIRI: target.typeIRI,
        data: target.data,
        disableInlineEditing: true,
      },
      { origin: { source: `entity-open:${params.surface}` } },
    );
  }, [detailModal, target, params.surface]);

  const openNewTab = useCallback(() => {
    if (!target.entityIRI) return;
    void dispatchIntent({
      kind: "show-entity",
      entityIRI: target.entityIRI,
      typeIRI: target.typeIRI,
      typeName: target.typeName,
      data: target.data,
      presentation: "new-tab",
    });
  }, [dispatchIntent, target]);

  const onClick = useCallback(
    (event?: MouseEvent) => {
      if (!event) {
        openModal();
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (
          capabilities.has("open-in-new-tab", target) ||
          capabilities.has("open-in-route", target)
        ) {
          openNewTab();
        } else {
          openModal();
        }
        return;
      }
      openModal();
    },
    [capabilities, openModal, openNewTab, target],
  );

  const onAuxClick = useCallback(
    (event: MouseEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      event.stopPropagation();
      if (
        capabilities.has("open-in-new-tab", target) ||
        capabilities.has("open-in-route", target)
      ) {
        openNewTab();
      }
    },
    [capabilities, openNewTab, target],
  );

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      openContextMenu(event);
    },
    [openContextMenu],
  );

  return useMemo(
    () => ({
      onClick,
      onAuxClick,
      onContextMenu,
      contextMenu,
    }),
    [onClick, onAuxClick, onContextMenu, contextMenu],
  );
}
