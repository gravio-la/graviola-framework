/**
 * Type-safe filtering hook for querying multiple entity types with shared filters
 *
 * This hook allows you to query multiple types (e.g., Workshop, Shed, Patch) that
 * share a common relationship property (e.g., geoFeature) with a single API call,
 * returning type-safe results with per-type loading states.
 *
 * @example
 * ```typescript
 * const {
 *   workshops,
 *   sheds,
 *   patches,
 *   beeStands
 * } = useAnyOfFilterStore<{
 *   workshops: Workshop[],
 *   sheds: Shed[],
 *   patches: Patch[],
 *   beeStands: BeeStand[]
 * }>({
 *   workshops: "Workshop",
 *   sheds: "Shed",
 *   patches: "Patch",
 *   beeStands: "BeeStand"
 * }, {
 *   where: {
 *     geoFeature: {
 *       '@id': feature['@id']
 *     }
 *   }
 * });
 *
 * // Each result has per-type loading state:
 * if (workshops.isLoading) return <Spinner />;
 * return <div>{workshops.data.map(w => <WorkshopCard key={w['@id']} workshop={w} />)}</div>;
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TypedDocumentsSearchOptions } from "@graviola/edb-global-types";
import { useDataStore } from "./useDataStore";

/**
 * Type mapping from result keys to their type names
 * Example: { workshops: "Workshop", sheds: "Shed" }
 */
export type TypeMapping = Record<string, string>;

/**
 * Map type mapping to result structure
 * Each key contains an array of the corresponding type
 */
export type AnyOfFilterStoreResult<TResultMap extends Record<string, any[]>> = {
  [K in keyof TResultMap]: TResultMap[K];
};

/**
 * Hook for querying multiple entity types with shared relationship filters
 *
 * This hook:
 * 1. Queries all entities matching the where filter and gets their classes
 * 2. Groups entities by type
 * 3. For each requested type, loads full documents imperatively
 * 4. Returns all results together once all queries settle
 *
 * @template TResultMap - Map of result keys to their array types
 * @param typeMapping - Mapping of result keys to type names (e.g., { workshops: "Workshop" })
 * @param options - Filter options (primarily the where clause)
 * @returns Object with per-type results, overall loading state, and error
 *
 * @example
 * ```typescript
 * type ResultMap = {
 *   workshops: Workshop[];
 *   sheds: Shed[];
 *   patches: Patch[];
 * };
 *
 * const { data, isLoading, error } = useAnyOfFilterStore<ResultMap>(
 *   {
 *     workshops: "Workshop",
 *     sheds: "Shed",
 *     patches: "Patch"
 *   },
 *   {
 *     where: {
 *       geoFeature: { '@id': 'http://example.com/feature/1' }
 *     }
 *   }
 * );
 *
 * // Access per-type data
 * if (!isLoading) {
 *   console.log(data.workshops); // Workshop[]
 *   console.log(data.sheds); // Shed[]
 * }
 * ```
 */
export function useAnyOfFilterStore<
  TResultMap extends Record<string, any[]> = Record<string, any[]>,
>(
  typeMapping: TypeMapping,
  options: TypedDocumentsSearchOptions<any> = {},
): UseQueryResult<AnyOfFilterStoreResult<TResultMap>, Error> {
  const { dataStore, ready } = useDataStore();
  const queryClient = useQueryClient();

  return useQuery<AnyOfFilterStoreResult<TResultMap>, Error>({
    queryKey: ["anyOfFilterStore", typeMapping, options],
    queryFn: async () => {
      if (
        !ready ||
        !dataStore.getEntitiesWithClassesByFilter ||
        !dataStore.filterTypedDocuments
      ) {
        throw new Error("datastore must be ready and support required methods");
      }

      // Step 1: Get all entities matching the filter and their classes
      const entityClassMap =
        await dataStore.getEntitiesWithClassesByFilter(options);

      // Step 2: Group entities by requested types
      const typeNameEntityMap = new Map<string, string[]>();
      Object.keys(typeMapping).forEach((key) => {
        typeNameEntityMap.set(key, []);
      });

      for (const [entityIRI, classIRIs] of entityClassMap.entries()) {
        for (const [resultKey, typeName] of Object.entries(typeMapping)) {
          const typeIRI = dataStore.typeNameToTypeIRI(typeName);
          if (classIRIs.includes(typeIRI)) {
            const entities = typeNameEntityMap.get(resultKey) || [];
            entities.push(entityIRI);
            typeNameEntityMap.set(resultKey, entities);
          }
        }
      }

      // Step 3: Load full documents for each type (let all queries settle)
      const typeQueries = Object.entries(typeMapping).map(
        async ([resultKey, typeName]) => {
          const entityIRIs = typeNameEntityMap.get(resultKey) || [];

          if (entityIRIs.length === 0) {
            return [resultKey, []];
          }

          // Query with the same where clause - it will return only entities of this type that match
          const allDocuments = await queryClient.fetchQuery({
            queryKey: ["typedDocuments", typeName, options],
            queryFn: async () => {
              return await dataStore.filterTypedDocuments!(typeName, options);
            },
            staleTime: 0,
          });

          // Filter to only the entities we found (for consistency, though query should already return these)
          const documents = allDocuments.filter((doc: any) =>
            entityIRIs.includes(doc["@id"]),
          );

          return [resultKey, documents];
        },
      );

      // Wait for all queries to settle
      const results = await Promise.all(typeQueries);

      // Build result object
      const result = {} as AnyOfFilterStoreResult<TResultMap>;
      for (const [key, documents] of results) {
        result[key as keyof TResultMap] = documents as any;
      }

      return result;
    },
    enabled: Boolean(ready),
    refetchOnWindowFocus: false,
  });
}
