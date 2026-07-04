import { CRUDFunctions } from "@graviola/edb-core-types";
import { createContext, useContext } from "react";

import type { CrudDatastoreStore } from "../crudDatastoreStore";

type CrudProviderContextValue = {
  crudOptions: CRUDFunctions | null;
  dataStore: CrudDatastoreStore | null;
  isReady: boolean;
  /** Disambiguates TanStack Query keys when multiple stores/contexts share one QueryClient. */
  queryCacheScope?: string;
};

export type { CrudProviderContextValue };

export const CrudProviderContext =
  createContext<CrudProviderContextValue>(null);

export const useCrudProvider = () => {
  const context = useContext(CrudProviderContext);
  if (!context) {
    throw new Error("useCrudProvider must be used within a CrudProvider");
  }
  return context;
};
