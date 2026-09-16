import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ViewDensity } from "@graviola/edb-core-types";

const STORAGE_KEY = "graviola:view-density";

type ViewDensityContextValue = {
  density: ViewDensity;
  setDensity: (density: ViewDensity) => void;
  isOverride: boolean;
};

const ViewDensityContext = createContext<ViewDensityContextValue | null>(null);

function readStoredDensity(fallback: ViewDensity): ViewDensity {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "condensed" || stored === "extended") return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

export type ViewDensityProviderProps = {
  children: React.ReactNode;
  /** Global default when no localStorage value exists. */
  defaultDensity?: ViewDensity;
  /** Initial density for a local (non-persisted) listing override. */
  density?: ViewDensity;
  /** When true, density changes are session-local and never persisted. */
  local?: boolean;
};

export function ViewDensityProvider({
  children,
  defaultDensity = "extended",
  density: initialDensity,
  local = false,
}: ViewDensityProviderProps) {
  const parent = useContext(ViewDensityContext);
  const isLocalProvider = local || parent != null;

  const [globalDensity, setGlobalDensityState] = useState<ViewDensity>(() =>
    readStoredDensity(defaultDensity),
  );

  const [localDensity, setLocalDensity] = useState<ViewDensity>(
    initialDensity ?? parent?.density ?? defaultDensity,
  );

  const setDensity = useCallback(
    (next: ViewDensity) => {
      if (isLocalProvider) {
        setLocalDensity(next);
        return;
      }
      setGlobalDensityState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [isLocalProvider],
  );

  const value = useMemo<ViewDensityContextValue>(() => {
    if (isLocalProvider) {
      return {
        density: localDensity,
        setDensity,
        isOverride: true,
      };
    }
    return {
      density: globalDensity,
      setDensity,
      isOverride: false,
    };
  }, [globalDensity, isLocalProvider, localDensity, setDensity]);

  return (
    <ViewDensityContext.Provider value={value}>
      {children}
    </ViewDensityContext.Provider>
  );
}

export function useViewDensity(): ViewDensityContextValue {
  const ctx = useContext(ViewDensityContext);
  if (!ctx) {
    return {
      density: "extended",
      setDensity: () => {},
      isOverride: false,
    };
  }
  return ctx;
}
