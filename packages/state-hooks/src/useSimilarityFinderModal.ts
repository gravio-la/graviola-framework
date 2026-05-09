import { useCallback } from "react";
import type { EntityFinderProps } from "@graviola/semantic-jsonform-types";
import { useGlobalSearch } from "./useGlobalSearch";
import { useGraviolaModal } from "./modal-registry/ModalRegistry";
import { MODAL_SIMILARITY_FINDER } from "./modal-registry/constants";

export type SimilarityFinderModalProps = Omit<EntityFinderProps, "search">;

/**
 * Opens the registered {@link MODAL_SIMILARITY_FINDER} (SimilarityFinderDrawer) with
 * live search bound to {@link useGlobalSearch}. {@link useGlobalSearch#similarityFinderOpen}
 * tracks panel visibility for the floating toggle button.
 */
export function useSimilarityFinderModal() {
  const finderModal = useGraviolaModal(MODAL_SIMILARITY_FINDER);
  const similarityFinderOpen = useGlobalSearch((s) => s.similarityFinderOpen);

  const showFinder = useCallback(
    (props: SimilarityFinderModalProps) => {
      return finderModal.show(props as Record<string, unknown>);
    },
    [finderModal],
  );

  const hideFinder = useCallback(() => {
    finderModal.hide();
  }, [finderModal]);

  const toggleFinder = useCallback(
    (props: SimilarityFinderModalProps) => {
      if (similarityFinderOpen) {
        finderModal.hide();
        return;
      }
      return finderModal.show(props as Record<string, unknown>);
    },
    [finderModal, similarityFinderOpen],
  );

  return {
    showFinder,
    hideFinder,
    toggleFinder,
    similarityFinderOpen,
    finderModal,
  };
}
