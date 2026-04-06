/**
 * Type-safe filter system for SPARQL graph traversal
 *
 * This module provides TypeScript types for building Prisma-style WHERE clauses
 * with full type safety and schema inference.
 */

import type { PaginationMetadata } from "./index";

/**
 * String-specific filter operators
 * Available for properties of type string
 */
export type StringFilterOperators = {
  equals?: string;
  not?: string;
  in?: string[];
  notIn?: string[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: "default" | "insensitive";
};

/**
 * Number-specific filter operators
 * Available for properties of type number
 */
export type NumberFilterOperators = {
  equals?: number;
  not?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
};

/**
 * Boolean filter operators
 * Available for properties of type boolean
 */
export type BooleanFilterOperators = {
  equals?: boolean;
  not?: boolean;
};

/**
 * DateTime filter operators (for xsd:dateTime strings)
 * Available for Date types or dateTime format strings
 */
export type DateTimeFilterOperators = {
  equals?: string | Date;
  not?: string | Date;
  lt?: string | Date;
  lte?: string | Date;
  gt?: string | Date;
  gte?: string | Date;
};

/**
 * Flavour-specific filter operators (future extensibility)
 * These are only available when the appropriate flavour is set
 */
export type GeoFilterOperators = {
  inCircle?: {
    center: { lat: number; lon: number };
    radius: number; // km
  };
  inBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

/**
 * Node reference type - represents a reference to a linked data entity by IRI
 * Can use full IRI, prefixed IRI, or default prefix
 */
export type NodeReference = {
  "@id": string;
};

/**
 * Relationship filter operators
 * Available for array properties that represent relationships to other entities
 *
 * Follows Prisma's naming conventions:
 * - some: At least one related entity matches the filter
 * - every: All related entities must match the filter
 * - none: No related entities match the filter
 */
export type RelationshipFilterOperators<T> = {
  // At least one related entity matches (default when using shorthand)
  some?: NodeReference | TypedWhereInput<T>;
  // All specified entities must be present in the relationship
  every?: NodeReference[] | TypedWhereInput<T>[];
  // No related entities match the criteria
  none?: NodeReference | NodeReference[] | TypedWhereInput<T>;
};

/**
 * Map TypeScript types to appropriate filter operators
 * This is the key to type-safe filtering - each type gets its own operators
 *
 * For union types (e.g., string | number), TypeScript's conditional types distribute
 * over the union, giving you all operators from all constituent types.
 *
 * Defaults to `any` for backward compatibility when T is `any`.
 */
export type FilterOperatorsForType<T> =
  // Handle `any` type for backward compatibility
  0 extends 1 & T
    ? any
    : // String type gets string operators
      T extends string
      ? string | StringFilterOperators
      : // Number type gets number operators
        T extends number
        ? number | NumberFilterOperators
        : // Boolean type gets boolean operators
          T extends boolean
          ? boolean | BooleanFilterOperators
          : // Date type gets datetime operators
            T extends Date
            ? string | Date | DateTimeFilterOperators
            : // Array types - check if it's a relationship array or primitive array
              T extends Array<infer U>
              ? // If array of objects with @id, it's a relationship - add relationship operators
                U extends { "@id"?: string }
                ?
                    | NodeReference
                    | RelationshipFilterOperators<U>
                    | TypedWhereInput<U>
                    | TypedWhereInput<U>[]
                : // Otherwise it's a primitive array - recurse normally
                    TypedWhereInput<U> | TypedWhereInput<U>[]
              : // Object types - check if it's a single relationship or regular object
                T extends object
                ? // Single object with @id is a one-to-one relationship
                  T extends { "@id"?: string }
                  ? NodeReference | TypedWhereInput<T>
                  : // Regular object - recurse into properties
                    TypedWhereInput<T>
                : // Fallback for truly unknown types - uses never to prevent invalid filters
                  never;

/**
 * Type-safe WHERE input that derives filter operators from type T
 * Similar to TypedIncludePattern but for filtering
 *
 * Each property gets operators based on its type:
 * - string: equals, contains, startsWith, endsWith, in, notIn, mode
 * - number: equals, gt, gte, lt, lte, in, notIn
 * - boolean: equals, not
 * - Date: equals, gt, gte, lt, lte
 * - Array<T>: nested where for array elements
 * - Object: nested where for object properties
 *
 * Supports union types (e.g., string | number gets both string and number operators)
 *
 * @template T - The type to derive filter from (typically z.infer<typeof schema>)
 */
export type TypedWhereInput<T> = {
  [K in keyof T]?: FilterOperatorsForType<NonNullable<T[K]>>;
} & {
  // Logical operators at any level
  AND?: TypedWhereInput<T> | TypedWhereInput<T>[];
  OR?: TypedWhereInput<T> | TypedWhereInput<T>[];
  NOT?: TypedWhereInput<T> | TypedWhereInput<T>[];
};

/**
 * Flavour-aware WHERE input that adds flavour-specific operators
 *
 * @template T - The type to derive filter from
 * @template F - The SPARQL flavour ('default' | 'blazegraph' | 'oxigraph' | 'allegro')
 */
export type FlavourAwareWhereInput<
  T,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = TypedWhereInput<T> &
  (F extends "blazegraph"
    ? {
        // Blazegraph-specific: geo filters on string properties (coordinates)
        [K in keyof T]?: T[K] extends string
          ? FilterOperatorsForType<T[K]> | GeoFilterOperators
          : FilterOperatorsForType<NonNullable<T[K]>>;
      }
    : {});

/**
 * Type-safe select pattern for explicitly choosing fields
 * Defaults to `any` when no type parameter is provided for backward compatibility
 */
export type TypedSelectPattern<T = any> = {
  [K in keyof T]?: boolean;
};

/**
 * Helper type to unwrap array types to their element types
 * For nested include patterns, we need to work with array elements
 */
type UnwrapArray<T> = T extends Array<infer U> ? U : T;

/**
 * Type-safe omit pattern for excluding fields
 * Matches OmitPattern from core-types - uses array of keys
 * Defaults to `any` when no type parameter is provided for backward compatibility
 */
export type TypedOmitPattern<T = any> = Array<keyof T>;

/**
 * Base filter pattern containing the core filtering operations
 * This is the fundamental pattern reused throughout the system for filtering and field selection
 *
 * @template T - The type to derive filter patterns from
 * @template F - The SPARQL flavour for flavour-specific operators
 */
export type TypedFilterPattern<
  T = any,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = {
  select?: TypedSelectPattern<T>;
  include?: TypedIncludePattern<T>;
  omit?: TypedOmitPattern<T>;
  where?: FlavourAwareWhereInput<T, F>;
};

/**
 * Nested filter options that combine pagination with the core filter pattern
 * Used within TypedIncludePattern for nested relationship filtering
 *
 * @template T - The element type (array types are already unwrapped)
 */
export type NestedFilterOptions<T> = PaginationMetadata &
  Pick<TypedFilterPattern<T>, "select" | "include" | "omit" | "where">;

/**
 * Type-safe include pattern with support for nested includes, pagination, and filtering
 * Fully recursive - matches the structure of IncludePattern from core-types
 * Defaults to `any` when no type parameter is provided for backward compatibility
 *
 * Nested relationships can use the full filter pattern (select, include, omit, where)
 * combined with pagination options (take, skip, orderBy)
 *
 * @example
 * ```typescript
 * type Person = { name: string; friends: Array<{ name: string; age: number }> };
 * const include: TypedIncludePattern<Person> = {
 *   friends: {
 *     take: 10,
 *     skip: 0,
 *     orderBy: { name: 'asc' },
 *     where: { age: { gte: 21 } },
 *     include: {
 *       name: true,
 *       age: true
 *     }
 *   }
 * };
 * ```
 */
export type TypedIncludePattern<T = any> = {
  [K in keyof T]?:
    | boolean
    | NestedFilterOptions<UnwrapArray<NonNullable<T[K]>>>;
};

/**
 * Type-safe graph traversal filter options
 * Extends the base filter pattern with additional configuration options
 * Defaults to `any` when no type parameter is provided for backward compatibility
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof schema>)
 * @template F - The SPARQL flavour for flavour-specific operators
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * const schema = z.object({ name: z.string(), age: z.number() });
 * type Person = z.infer<typeof schema>;
 *
 * const options: TypedGraphTraversalFilterOptions<Person> = {
 *   select: { name: true, age: true },
 *   where: { age: { gte: 18 } },
 *   includeRelationsByDefault: false
 * };
 * ```
 */
export type TypedGraphTraversalFilterOptions<
  T = any,
  F extends "default" | "blazegraph" | "oxigraph" | "allegro" = "default",
> = TypedFilterPattern<T, F> & {
  includeRelationsByDefault?: boolean;
  defaultPaginationLimit?: number;
  /**
   * Whether to exclude JSON-LD metadata properties (starting with @)
   * from schema normalization. Defaults to true.
   *
   * JSON-LD properties like @id, @type, @context, @graph are metadata
   * and should not be mapped to RDF predicates in SPARQL queries.
   */
  excludeJsonLdMetadata?: boolean;
  /**
   * Runtime validation mode for filters
   * - 'throw': Throw an error if filter is invalid for the schema
   * - 'warn': Log a warning if filter is invalid
   * - 'ignore': Skip validation (default)
   *
   * Requires passing the schema to validation functions (Phase 2)
   */
  filterValidationMode?: "throw" | "warn" | "ignore";
};
