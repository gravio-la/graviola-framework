import {
  useSimilarityFinderModal,
  type SimilarityFinderModalProps,
} from "@graviola/edb-state-hooks";
import React from "react";
import { FloatingButton } from "./FloatingButton";

export type SearchbarWithFloatingButtonProps = {
  finderProps: SimilarityFinderModalProps;
};

/**
 * Floating action button that toggles the NiceModal similarity-finder panel.
 * Field focus should call {@link useSimilarityFinderModal#showFinder} separately
 * (typically from {@link useGlobalSearchWithHelper#handleFocus}).
 */
export const SearchbarWithFloatingButton = ({
  finderProps,
}: SearchbarWithFloatingButtonProps) => {
  const { similarityFinderOpen, toggleFinder } = useSimilarityFinderModal();
  return (
    <FloatingButton
      drawerOpen={similarityFinderOpen}
      drawerWidth={similarityFinderOpen ? 500 : 0}
      toggleDrawer={() => toggleFinder(finderProps)}
    />
  );
};
