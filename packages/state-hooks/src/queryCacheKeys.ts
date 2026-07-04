import { useCrudProvider } from "./provider/crudProviderContext";

export const DEFAULT_QUERY_CACHE_SCOPE = "default";

/** Ambient TanStack Query scope from {@link CrudProviderContext}. */
export function useQueryCacheScope(): string {
  const { queryCacheScope } = useCrudProvider();
  return queryCacheScope ?? DEFAULT_QUERY_CACHE_SCOPE;
}

/** Prefix entity/type/filter query keys with store/context identity. */
export function crudQueryKey(scope: string, ...parts: unknown[]): unknown[] {
  return ["crud", scope, ...parts];
}
