import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { createDatastoreEntitySuggestProvider } from "./datastoreSuggest";
import type { EntitySuggestOptions, EntitySuggestProvider } from "../types";

const EntitySuggestContext = createContext<EntitySuggestProvider | null>(null);

export type EntitySuggestProviderProps = {
  children: ReactNode;
  provider?: EntitySuggestProvider;
};

export const EntitySuggestContextProvider: FC<EntitySuggestProviderProps> = ({
  children,
  provider,
}) => {
  const fallback = useMemo(() => createDatastoreEntitySuggestProvider(), []);
  const value = provider ?? fallback;

  return (
    <EntitySuggestContext.Provider value={value}>
      {children}
    </EntitySuggestContext.Provider>
  );
};

export function useEntitySuggestProvider(): EntitySuggestProvider {
  const ctx = useContext(EntitySuggestContext);
  if (!ctx) {
    return createDatastoreEntitySuggestProvider();
  }
  return ctx;
}

export function useEntitySuggest(
  query: string,
  options?: EntitySuggestOptions,
) {
  const provider = useEntitySuggestProvider();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["entity-suggest", trimmed, options?.typeNames, options?.limit],
    enabled: trimmed.length >= 1,
    queryFn: () => provider.suggest(trimmed, options),
    staleTime: 30_000,
  });
}
