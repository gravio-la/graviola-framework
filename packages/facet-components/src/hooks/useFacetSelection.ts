import {
  clearAll,
  clearScope,
  emptySelection,
  parseSelection,
  serializeSelection,
  setRange,
  toggleTerm,
  type FacetDescriptor,
  type FacetSelection,
} from "@graviola/facet-core";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type UseFacetSelectionOptions = {
  descriptors: FacetDescriptor[];
  typeNames: string[];
  /** Sync selection to URL search params when react-router is available */
  syncUrl?: boolean;
  initialSelection?: FacetSelection;
};

export function useFacetSelection(options: UseFacetSelectionOptions) {
  const { descriptors, typeNames, syncUrl = false, initialSelection } = options;
  const [params, setParams] = useSearchParams();
  const urlSelection = useMemo(() => {
    if (!syncUrl) return undefined;
    return parseSelection(params, descriptors).selection;
  }, [syncUrl, params, descriptors]);

  const [localSelection, setLocalSelection] = useState<FacetSelection>(
    initialSelection ?? emptySelection(),
  );

  const selection = syncUrl ? (urlSelection ?? localSelection) : localSelection;

  const commit = useCallback(
    (next: FacetSelection) => {
      if (syncUrl) {
        const nextParams = new URLSearchParams(params);
        const serialized = serializeSelection(next, descriptors, typeNames);
        for (const key of [...nextParams.keys()]) {
          if (key === "q" || key.startsWith("f.") || key === "t") {
            nextParams.delete(key);
          }
        }
        for (const [k, v] of serialized.entries()) {
          nextParams.set(k, v);
        }
        setParams(nextParams, { replace: true });
      } else {
        setLocalSelection(next);
      }
    },
    [syncUrl, params, setParams, descriptors, typeNames],
  );

  return {
    selection,
    toggleTerm: (scope: string, value: string | number | boolean) =>
      commit(toggleTerm(selection, scope, value)),
    setRange: (scope: string, gte?: number | string, lte?: number | string) =>
      commit(setRange(selection, scope, { gte, lte })),
    clearScope: (scope: string) => commit(clearScope(selection, scope)),
    clearAll: () => commit(clearAll()),
  };
}
