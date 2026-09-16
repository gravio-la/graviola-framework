import { useCallback } from "react";
import type { EntityActionDef } from "@graviola/edb-core-types";
import type { EntityActionTarget } from "@graviola/edb-detail-renderer-core";
import {
  MODAL_ENTITY_DETAIL,
  useDispatchIntent,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";

export function useExecuteEntityAction() {
  const dispatchIntent = useDispatchIntent();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  return useCallback(
    (
      action: EntityActionDef,
      target: EntityActionTarget,
      onCustom?: (actionId: string) => void,
    ) => {
      if (action.run) {
        void action.run([target]);
        return;
      }
      if (action.href) {
        window.open(action.href, "_blank", "noopener,noreferrer");
        return;
      }

      const base = {
        entityIRI: target.entityIRI,
        typeIRI: target.typeIRI,
        typeName: target.typeName,
        data: target.data,
      };

      switch (action.intent) {
        case "show":
          if (target.entityIRI) {
            void detailModal.show(
              {
                entityIRI: target.entityIRI,
                typeIRI: target.typeIRI,
                data: target.data,
                disableInlineEditing: true,
              },
              { origin: { source: "entity-action:show" } },
            );
          }
          break;
        case "edit":
          if (target.entityIRI && target.typeName) {
            void dispatchIntent({
              kind: "edit-entity",
              typeName: target.typeName,
              entityIRI: target.entityIRI,
              origin: { source: "entity-action:edit" },
            });
          }
          break;
        case "open-in-route":
          if (target.entityIRI) {
            void dispatchIntent({
              kind: "show-entity",
              ...base,
              entityIRI: target.entityIRI,
              presentation: "route",
            });
          }
          break;
        case "open-in-new-tab":
          if (target.entityIRI) {
            void dispatchIntent({
              kind: "show-entity",
              ...base,
              entityIRI: target.entityIRI,
              presentation: "new-tab",
            });
          }
          break;
        case "open-in-window":
          if (target.entityIRI) {
            void dispatchIntent({
              kind: "show-entity",
              ...base,
              entityIRI: target.entityIRI,
              presentation: "new-window",
            });
          }
          break;
        case "custom":
        default:
          onCustom?.(action.id);
          break;
      }
    },
    [detailModal, dispatchIntent],
  );
}
