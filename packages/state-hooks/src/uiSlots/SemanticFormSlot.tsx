import type { SemanticJsonFormNoOpsProps } from "@graviola/semantic-jsonform-types";
import { createContext, useContext, type FC, type ReactNode } from "react";

const SemanticFormSlotContext =
  createContext<FC<SemanticJsonFormNoOpsProps> | null>(null);

export type SemanticFormSlotProviderProps = {
  Component: FC<SemanticJsonFormNoOpsProps>;
  children: ReactNode;
};

/** Supplies the JSON Forms shell used inside {@link EditEntityModal} (breaks AC↔SJF cycles). */
export function SemanticFormSlotProvider({
  Component,
  children,
}: SemanticFormSlotProviderProps) {
  return (
    <SemanticFormSlotContext.Provider value={Component}>
      {children}
    </SemanticFormSlotContext.Provider>
  );
}

export function useSemanticFormSlot(): FC<SemanticJsonFormNoOpsProps> {
  const C = useContext(SemanticFormSlotContext);
  if (!C) {
    throw new Error(
      "useSemanticFormSlot: wrap the tree with SemanticFormSlotProvider (GraviolaAppProvider wires SemanticJsonFormNoOps).",
    );
  }
  return C;
}
