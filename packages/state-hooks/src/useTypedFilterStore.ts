/**
 * Type-safe filtering hook with Prisma-style API
 *
 * Provides both React Query hooks and imperative async functions for:
 * - Loading single entities with type-safe filters
 * - Finding multiple entities by type with filters
 *
 * All operations use queryClient for proper cache integration.
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  TypedDocumentFilterOptions,
  TypedDocumentsSearchOptions,
} from "@graviola/edb-global-types";
import { useDataStore } from "./useDataStore";

/**
 * Hook for type-safe document loading with Prisma-style filters
 *
 * Provides both declarative (React Query) and imperative APIs for loading documents.
 * All async functions use queryClient.fetchQuery for proper cache integration.
 *
 * @template T - The type to derive filters from (typically z.infer<typeof zodSchema>)
 * @param typeName - The name of the type in the schema (e.g., "Person")
 * @returns Object with React Query hooks and imperative async functions
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const PersonSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   friends: z.array(z.object({ name: z.string() }))
 * });
 *
 * type Person = z.infer<typeof PersonSchema>;
 *
 * function MyComponent() {
 *   const { useLoadDocument, loadDocumentsAsync } = useTypedFilterStore<Person>("Person");
 *
 *   // React Query approach (declarative)
 *   const { data, isLoading } = useLoadDocument(personIRI, {
 *     select: { name: true, age: true },
 *     include: { friends: { take: 10 } },
 *     where: { age: { gte: 18 } }
 *   });
 *
 *   // Imperative approach (uses queryClient)
 *   const handleSearch = async () => {
 *     const results = await loadDocumentsAsync({
 *       where: { age: { gte: 21 } },
 *       searchString: 'john',
 *       limit: 50
 *     });
 *   };
 *
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useTypedFilterStore<T = any>(typeName: string) {
  const { dataStore, ready } = useDataStore();
  const queryClient = useQueryClient();

  /**
   * React Query hook for loading a single document with type-safe filters
   *
   * @param entityIRI - IRI of the entity to load
   * @param options - Type-safe filter options (select, include, where, etc.)
   * @param queryOptions - Additional React Query options
   * @returns React Query result
   */
  const useLoadDocument = useCallback(
    (
      entityIRI: string,
      options: TypedDocumentFilterOptions<T> = {},
      queryOptions?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
    ) => {
      return useQuery<T, Error>({
        queryKey: ["typedDocument", typeName, entityIRI, options],
        queryFn: async () => {
          if (!entityIRI || !ready) {
            throw new Error(
              "entityIRI is required and datastore must be ready",
            );
          }

          if (!dataStore.filterTypedDocument) {
            throw new Error(
              "filterTypedDocument not supported by this datastore",
            );
          }

          const result = await dataStore.filterTypedDocument<T>(
            typeName,
            entityIRI,
            options,
          );

          return result;
        },
        enabled: Boolean(entityIRI && ready) && (queryOptions?.enabled ?? true),
        refetchOnWindowFocus: false,
        ...queryOptions,
      });
    },
    [typeName, dataStore, ready],
  );

  /**
   * React Query hook for finding multiple documents by type with filters
   *
   * @param options - Type-safe filter and search options
   * @param queryOptions - Additional React Query options
   * @returns React Query result with array of documents
   */
  const useLoadDocuments = useCallback(
    (
      options: TypedDocumentsSearchOptions<T> = {},
      queryOptions?: Omit<UseQueryOptions<T[], Error>, "queryKey" | "queryFn">,
    ) => {
      return useQuery<T[], Error>({
        queryKey: ["typedDocuments", typeName, options],
        queryFn: async () => {
          if (!ready) {
            throw new Error("datastore must be ready");
          }

          if (!dataStore.filterTypedDocuments) {
            throw new Error(
              "filterTypedDocuments not supported by this datastore",
            );
          }

          const results = await dataStore.filterTypedDocuments<T>(
            typeName,
            options,
          );

          return results;
        },
        enabled: Boolean(ready) && (queryOptions?.enabled ?? true),
        refetchOnWindowFocus: false,
        ...queryOptions,
      });
    },
    [typeName, dataStore, ready],
  );

  /**
   * Imperative async function for loading a single document
   * Uses queryClient.fetchQuery for proper cache integration
   *
   * @param entityIRI - IRI of the entity to load
   * @param options - Type-safe filter options
   * @returns Promise resolving to the document
   */
  const loadDocumentAsync = useCallback(
    async (
      entityIRI: string,
      options: TypedDocumentFilterOptions<T> = {},
    ): Promise<T> => {
      if (!entityIRI || !ready) {
        throw new Error("entityIRI is required and datastore must be ready");
      }

      if (!dataStore.filterTypedDocument) {
        throw new Error("filterTypedDocument not supported by this datastore");
      }

      return queryClient.fetchQuery({
        queryKey: ["typedDocument", typeName, entityIRI, options],
        queryFn: async () => {
          const result = await dataStore.filterTypedDocument<T>(
            typeName,
            entityIRI,
            options,
          );

          return result;
        },
        staleTime: 0,
      });
    },
    [queryClient, typeName, dataStore, ready],
  );

  /**
   * Imperative async function for finding multiple documents
   * Uses queryClient.fetchQuery for proper cache integration
   *
   * @param options - Type-safe filter and search options
   * @returns Promise resolving to array of documents
   */
  const loadDocumentsAsync = useCallback(
    async (options: TypedDocumentsSearchOptions<T> = {}): Promise<T[]> => {
      if (!ready) {
        throw new Error("datastore must be ready");
      }

      if (!dataStore.filterTypedDocuments) {
        throw new Error("filterTypedDocuments not supported by this datastore");
      }

      return queryClient.fetchQuery({
        queryKey: ["typedDocuments", typeName, options],
        queryFn: async () => {
          const results = await dataStore.filterTypedDocuments<T>(
            typeName,
            options,
          );

          return results;
        },
        staleTime: 0,
      });
    },
    [queryClient, typeName, dataStore, ready],
  );

  return {
    useLoadDocument,
    useLoadDocuments,
    loadDocumentAsync,
    loadDocumentsAsync,
  };
}
