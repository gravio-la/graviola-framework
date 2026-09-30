/**
 * Shared helpers for nested include/filter option shapes (Prisma-style).
 */

/**
 * Type guard: value is a nested filter options object (not boolean or array).
 */
export function isNestedFilterOptions(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extract nested filter options from an include value.
 * Omits pagination keys (take, skip, orderBy, _stage).
 */
export function extractNestedFilterOptions(
  includeValue: boolean | Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!includeValue || includeValue === true) {
    return {};
  }
  if (isNestedFilterOptions(includeValue)) {
    const { take, skip, orderBy, _stage, ...filterOptions } = includeValue;
    return filterOptions;
  }
  return {};
}
