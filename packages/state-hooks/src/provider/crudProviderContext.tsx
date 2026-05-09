import { CRUDFunctions } from "@graviola/edb-core-types";
import { createContext, useContext } from "react";

import type { CrudDatastoreStore } from "../crudDatastoreStore";

type CrudProviderContextValue = {
  crudOptions: CRUDFunctions | null;
  dataStore: CrudDatastoreStore | null;
  isReady: boolean;
};

export const CrudProviderContext =
  createContext<CrudProviderContextValue>(null);

export const useCrudProvider = () => {
  const context = useContext(CrudProviderContext);
  if (!context) {
    throw new Error("useCrudProvider must be used within a CrudProvider");
  }
  return context;
};
