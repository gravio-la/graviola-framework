import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const PathnameContext = createContext<string | undefined>(undefined);

export type PathnameProviderProps = {
  value: string;
  children: ReactNode;
};

export function PathnameProvider({ value, children }: PathnameProviderProps) {
  return (
    <PathnameContext.Provider value={value}>
      {children}
    </PathnameContext.Provider>
  );
}

function subscribePathname(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

function getPathnameSnapshot() {
  return window.location.pathname;
}

function getPathnameServerSnapshot() {
  return "/";
}

/**
 * Active pathname for UI that mirrors routing (e.g. nav highlight).
 * When wrapped in `<PathnameProvider>` (as in GraviolaAppProvider), uses the
 * injected value (typically react-router). Otherwise falls back to
 * `window.location.pathname` + `popstate`.
 */
export function usePathname(): string {
  const injected = useContext(PathnameContext);
  const live = useSyncExternalStore(
    subscribePathname,
    getPathnameSnapshot,
    getPathnameServerSnapshot,
  );
  return injected ?? live;
}
