import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import { useEffect } from "react";

import { bindDatastoreSuggest } from "./datastoreSuggest";

/** Keeps the fallback datastore suggest provider wired to the active store. */
export function DatastoreSuggestBinder() {
  const adb = useAdbContext();
  const { dataStore } = useDataStore();

  useEffect(() => {
    if (dataStore) {
      bindDatastoreSuggest(adb, dataStore);
    }
  }, [adb, dataStore]);

  return null;
}
