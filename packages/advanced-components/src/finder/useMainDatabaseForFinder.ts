import { useAdbContext, useCrudProvider } from "@graviola/edb-state-hooks";
import { useMemo } from "react";

import { KBMainDatabase } from "./KBMainDatabase";

export const useMainDatabaseForFinder = () => {
  const {
    queryBuildOptions: { primaryFields },
    typeIRIToTypeName,
  } = useAdbContext();
  const { dataStore } = useCrudProvider();
  return useMemo(
    () => KBMainDatabase(dataStore, primaryFields, typeIRIToTypeName),
    [dataStore, primaryFields, typeIRIToTypeName],
  );
};
