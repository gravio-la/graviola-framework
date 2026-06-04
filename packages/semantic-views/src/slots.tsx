import React, {
  createContext,
  useContext,
  type ComponentType,
  type FC,
  type ReactNode,
} from "react";

import type { SemanticViewProps } from "./types";

function createSlotProvider(
  context: React.Context<ComponentType<SemanticViewProps> | undefined>,
  displayName: string,
) {
  const Provider: FC<{
    component: ComponentType<SemanticViewProps>;
    children: ReactNode;
  }> = ({ component, children }) => (
    <context.Provider value={component}>{children}</context.Provider>
  );
  Provider.displayName = displayName;
  return Provider;
}

const SemanticChipSlotContext = createContext<
  ComponentType<SemanticViewProps> | undefined
>(undefined);
const SemanticListItemSlotContext = createContext<
  ComponentType<SemanticViewProps> | undefined
>(undefined);
const SemanticCardSlotContext = createContext<
  ComponentType<SemanticViewProps> | undefined
>(undefined);
const SemanticDetailViewSlotContext = createContext<
  ComponentType<SemanticViewProps> | undefined
>(undefined);

export const SemanticChipSlotProvider = createSlotProvider(
  SemanticChipSlotContext,
  "SemanticChipSlotProvider",
);
export const SemanticListItemSlotProvider = createSlotProvider(
  SemanticListItemSlotContext,
  "SemanticListItemSlotProvider",
);
export const SemanticCardSlotProvider = createSlotProvider(
  SemanticCardSlotContext,
  "SemanticCardSlotProvider",
);
export const SemanticDetailViewSlotProvider = createSlotProvider(
  SemanticDetailViewSlotContext,
  "SemanticDetailViewSlotProvider",
);

export function useSemanticChipSlot():
  | ComponentType<SemanticViewProps>
  | undefined {
  return useContext(SemanticChipSlotContext);
}
export function useSemanticListItemSlot():
  | ComponentType<SemanticViewProps>
  | undefined {
  return useContext(SemanticListItemSlotContext);
}
export function useSemanticCardSlot():
  | ComponentType<SemanticViewProps>
  | undefined {
  return useContext(SemanticCardSlotContext);
}
export function useSemanticDetailViewSlot():
  | ComponentType<SemanticViewProps>
  | undefined {
  return useContext(SemanticDetailViewSlotContext);
}
