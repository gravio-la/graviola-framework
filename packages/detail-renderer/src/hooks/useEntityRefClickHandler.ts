import { useCallback } from "react";
import {
  MODAL_ENTITY_DETAIL,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";

/**
 * Returns a factory that builds click handlers dispatching `show-entity` intent
 * (via NiceModal when registered, otherwise the intent bus).
 */
export function useEntityRefClickHandler() {
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  return useCallback(
    (entityIRI: string, typeIRI?: string, data?: unknown) => {
      return () => {
        void detailModal.show(
          { entityIRI, typeIRI, data },
          { origin: { source: "detail-renderer:entity-ref" } },
        );
      };
    },
    [detailModal],
  );
}
