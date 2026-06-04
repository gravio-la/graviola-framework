import { useCRUDWithQueryClient } from "./useCRUDWithQueryClient";
import { useTypeIRIFromEntity } from "./useTypeIRIFromEntity";
import { queryOptionMixinBasedOnEntity } from "@graviola/edb-ui-utils";

export type UseEntityArgs = {
  entityIRI: string;
  typeIRI?: string;
  typeName?: string;
  defaultData?: unknown;
  disableLoad?: boolean;
  loadQueryKey?: string;
};

/**
 * Thin wrapper over {@link useCRUDWithQueryClient} so Semantic* components at
 * different sizes share the same TanStack Query cache keys.
 */
export function useEntity({
  entityIRI,
  typeIRI,
  defaultData,
  disableLoad = false,
  loadQueryKey = "show",
}: UseEntityArgs) {
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);

  return useCRUDWithQueryClient({
    entityIRI,
    typeIRI: classIRI,
    loadQueryKey,
    queryOptions: {
      enabled: !disableLoad && Boolean(classIRI),
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(defaultData),
    },
  });
}
