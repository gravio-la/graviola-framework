import { create } from "zustand";

export type GlobalSearchState = {
  search: string;
  setSearch: (search: string) => void;
  typeName: string;
  setTypeName: (typeName: string) => void;
  path?: string;
  setPath: (path: string) => void;
  /** True while the NiceModal similarity-finder panel is visible. */
  similarityFinderOpen: boolean;
  setSimilarityFinderOpen: (open: boolean) => void;
};

export const useGlobalSearch = create<GlobalSearchState>((set) => ({
  search: "",
  path: undefined,
  setPath: (path: string) => set({ path }),
  setSearch: (search: string) => set({ search }),
  typeName: "",
  setTypeName: (typeName: string) => set({ typeName }),
  similarityFinderOpen: false,
  setSimilarityFinderOpen: (open: boolean) =>
    set({ similarityFinderOpen: open }),
}));
