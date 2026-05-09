import { useCrudProvider } from "./provider";
import type { CrudDatastoreStore } from "./crudDatastoreStore";

type UseDataStoreState = {
  dataStore?: CrudDatastoreStore | null;
  ready: boolean;
};

export const useDataStore = (): UseDataStoreState => {
  const { dataStore, isReady } = useCrudProvider();
  return {
    dataStore,
    ready: Boolean(isReady),
  };
};
