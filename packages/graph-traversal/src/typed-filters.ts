/**
 * Type-safe filter patterns for graph traversal based on Zod schema inference
 *
 * These types enable full type safety and IDE autocomplete when defining
 * include, select, and omit patterns for graph traversal operations.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { TypedIncludePattern } from './typed-filters';
 *
 * const personSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   friends: z.array(z.object({
 *     name: z.string(),
 *     email: z.string()
 *   }))
 * });
 *
 * type Person = z.infer<typeof personSchema>;
 *
 * // Type-safe include pattern - only valid keys allowed
 * const include: TypedIncludePattern<Person> = {
 *   name: true,
 *   friends: {
 *     take: 10,
 *     include: { name: true, email: true }
 *   }
 * };
 * ```
 */

import type {
  PaginationOptions,
  GraphTraversalFilterOptions,
} from "@graviola/edb-core-types";

/**
 * Helper type to extract array element type
 */
type ArrayElement<T> = T extends Array<infer U> ? U : never;

/**
 * Helper type to check if a type is an object (not array, not primitive)
 */
type IsObject<T> = T extends object
  ? T extends Array<any>
    ? false
    : true
  : false;

/**
 * Helper to extract the inner type, removing null/undefined
 * This allows us to work with optional properties correctly
 * Uses TypeScript's built-in NonNullable utility type
 */
type InnerType<T> = NonNullable<T>;

/**
 * Type-safe include pattern that derives allowed keys from type T
 *
 * For each property in T:
 * - Can be set to `true` or `false` (boolean)
 * - Can be an object with pagination options (take, skip, orderBy)
 * - If the property is an array, can have nested `include` for array items
 * - If the property is an object, can have nested `include` for object properties
 *
 * Supports deep nesting with full type safety at any level.
 *
 * @template T - The type to derive include pattern from (typically z.infer<typeof schema>)
 */
export type TypedIncludePattern<T> = {
  [K in keyof T]?: InnerType<T[K]> extends Array<infer U>
    ? // For arrays: allow boolean or pagination with optional nested include
      | boolean
        | (PaginationOptions & {
            include?: U extends object ? TypedIncludePattern<U> : never;
          })
    : InnerType<T[K]> extends object
      ? // For objects: allow boolean or pagination with optional nested include
        | boolean
          | (PaginationOptions & {
              include?: TypedIncludePattern<InnerType<T[K]>>;
            })
      : // For primitives: only boolean
        boolean;
};

/**
 * Type-safe select pattern that only allows valid keys from type T
 *
 * Each property can be set to `true` to include it or omitted to exclude it.
 * This is similar to Prisma's select pattern.
 *
 * @template T - The type to derive select pattern from
 *
 * @example
 * ```typescript
 * const select: TypedSelectPattern<Person> = {
 *   name: true,
 *   age: true
 *   // email: true would be an error if email is not in Person
 * };
 * ```
 */
export type TypedSelectPattern<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Type-safe omit pattern as an array of valid keys from type T
 *
 * @template T - The type to derive omit pattern from
 *
 * @example
 * ```typescript
 * const omit: TypedOmitPattern<Person> = ['age', 'email'];
 * // ['invalidKey'] would be an error
 * ```
 */
export type TypedOmitPattern<T> = Array<keyof T>;

/**
 * Type-safe graph traversal filter options
 *
 * Extends GraphTraversalFilterOptions but replaces the untyped
 * select, include, and omit with typed versions derived from T.
 *
 * @template T - The type to derive filter patterns from (typically z.infer<typeof schema>)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const schema = z.object({ name: z.string(), age: z.number() });
 * type Person = z.infer<typeof schema>;
 *
 * const options: TypedGraphTraversalFilterOptions<Person> = {
 *   select: { name: true },
 *   includeRelationsByDefault: false
 * };
 * ```
 */
export type TypedGraphTraversalFilterOptions<T> = Omit<
  GraphTraversalFilterOptions,
  "select" | "include" | "omit"
> & {
  select?: TypedSelectPattern<T>;
  include?: TypedIncludePattern<T>;
  omit?: TypedOmitPattern<T>;
};

/**
 * Helper type to extract nested property types for deep type safety
 *
 * @template T - The root type
 * @template Path - The property path as a tuple of keys
 *
 * @example
 * ```typescript
 * type Person = { address: { city: string } };
 * type CityType = NestedPropertyType<Person, ['address', 'city']>; // string
 * ```
 */
export type NestedPropertyType<T, Path extends any[]> = Path extends [
  infer First,
  ...infer Rest,
]
  ? First extends keyof T
    ? Rest extends []
      ? T[First]
      : T[First] extends Array<infer U>
        ? NestedPropertyType<U, Rest>
        : NestedPropertyType<T[First], Rest>
    : never
  : T;

/**
 * Type guard to check if a value conforms to TypedIncludePattern
 * Note: This is a runtime helper, actual type checking happens at compile time
 *
 * @param value - The value to check
 * @returns True if value could be a valid include pattern
 */
export function isTypedIncludePattern(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value conforms to TypedSelectPattern
 *
 * @param value - The value to check
 * @returns True if value could be a valid select pattern
 */
export function isTypedSelectPattern(
  value: unknown,
): value is Record<string, boolean> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === "boolean")
  );
}

/**
 * Type guard to check if a value conforms to TypedOmitPattern
 *
 * @param value - The value to check
 * @returns True if value is an array
 */
export function isTypedOmitPattern(value: unknown): value is Array<string> {
  return Array.isArray(value);
}
