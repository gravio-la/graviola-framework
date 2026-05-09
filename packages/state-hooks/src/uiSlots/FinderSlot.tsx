import type { EntityFinderProps } from "@graviola/semantic-jsonform-types";
import { createContext, useContext, type FC, type ReactNode } from "react";

const FinderSlotContext = createContext<FC<EntityFinderProps> | null>(null);

export type FinderSlotProviderProps = {
  Component: FC<EntityFinderProps>;
  children: ReactNode;
};

/** Supplies the similarity / authority finder component for JSON Forms sidebars. */
export function FinderSlotProvider({
  Component,
  children,
}: FinderSlotProviderProps) {
  return (
    <FinderSlotContext.Provider value={Component}>
      {children}
    </FinderSlotContext.Provider>
  );
}

export function useFinderSlot(): FC<EntityFinderProps> {
  const C = useContext(FinderSlotContext);
  if (!C) {
    throw new Error(
      "useFinderSlot: wrap the tree with FinderSlotProvider (GraviolaAppProvider wires the default similarity finder).",
    );
  }
  return C;
}
