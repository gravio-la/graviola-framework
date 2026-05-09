import { useQuery } from "@tanstack/react-query";
import { useDataStore } from "./useDataStore";
import { useMemo } from "react";

export const useTypeIRIFromEntity = (
  entityIRI: string,
  typeIRI?: string,
  disableQuery?: boolean,
) => {
  const { dataStore, ready } = useDataStore();
  const { data: typeIRIs } = useQuery({
    queryKey: [
      "entity",
      typeIRI ?? "__resolve_classes__",
      entityIRI,
      "classes",
    ],
    queryFn: async () => {
      return await dataStore.resolveTypes(entityIRI);
    },
    enabled: Boolean(!typeIRI && entityIRI && ready && !disableQuery),
  });
  return useMemo(() => typeIRI || typeIRIs?.[0], [typeIRI, typeIRIs]);
};
