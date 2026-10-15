import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";

export type DerivedDefaultHintEntry = {
  sourceTitle: string;
};

export type DerivedDefaultHintContextValue = {
  autoFilledPaths: ReadonlySet<string>;
  entryForPath: (path: string) => DerivedDefaultHintEntry | undefined;
};

const emptySet = new Set<string>();

export const DerivedDefaultHintContext =
  createContext<DerivedDefaultHintContextValue>({
    autoFilledPaths: emptySet,
    entryForPath: () => undefined,
  });

export function useDerivedDefaultHint(
  path: string,
): DerivedDefaultHintEntry | undefined {
  const ctx = useContext(DerivedDefaultHintContext);
  if (!ctx.autoFilledPaths.has(path)) {
    return undefined;
  }
  return ctx.entryForPath(path);
}

export type DerivedDefaultHintProviderProps = {
  value: DerivedDefaultHintContextValue;
  children: ReactNode;
};

export function DerivedDefaultHintProvider({
  value,
  children,
}: DerivedDefaultHintProviderProps): ReactNode {
  return createElement(DerivedDefaultHintContext.Provider, {
    value,
    children,
  });
}
