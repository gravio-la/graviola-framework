/**
 * IDBKeyRange construction for hexastore prefix scans.
 *
 * IndexedDB compound array keys are compared element-by-element.
 * A prefix scan over [a, b, ?, ?] is expressed as:
 *   IDBKeyRange.bound([a, b], [a, b, Infinity, Infinity], false, false)
 *
 * The `Infinity` sentinel works because the structured clone algorithm
 * serializes Infinity and it sorts after all numeric and string values
 * in the key comparison order used by most IndexedDB backends.
 *
 * See: https://www.w3.org/TR/IndexedDB/#key-construct
 * Key ordering: undefined < null < boolean < number < string < date < array
 * Within arrays: element-by-element, length as tiebreaker
 * Infinity sorts after all finite numbers.
 */

import type { IDBValidKey } from "./idb-types";

/**
 * Build an IDBKeyRange for a compound key prefix scan.
 *
 * @param prefix - The known leading elements of the compound key.
 *   Elements that are undefined/null are treated as wildcards (stop prefix there).
 * @param totalArity - Total number of components in the compound key.
 * @returns An IDBKeyRange that matches all keys with the given prefix,
 *   or null if no components are bound (meaning: scan everything).
 */
export function buildPrefixRange(
  prefix: (number | undefined)[],
  totalArity: number,
): IDBKeyRange | null {
  // Find the length of the bound prefix (stop at first undefined)
  let boundLength = 0;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] === undefined) break;
    boundLength = i + 1;
  }

  if (boundLength === 0) {
    // No bound components: full scan, no key range restriction
    return null;
  }

  const boundPart = prefix.slice(0, boundLength) as number[];

  if (boundLength === totalArity) {
    // All components bound: exact key (or exact prefix if g is unbound in a 3-component prefix)
    // For exact match, use IDBKeyRange.only
    return IDBKeyRange.only(boundPart);
  }

  // Prefix scan: lower bound is the prefix itself, upper bound has Infinity padding
  const lower = [...boundPart];
  const upper = [
    ...boundPart,
    ...Array(totalArity - boundLength).fill(Infinity),
  ];

  return IDBKeyRange.bound(lower, upper, false, false);
}

/**
 * Build an IDBKeyRange for an exact quad lookup (all 4 components bound).
 */
export function buildExactRange(
  s: number,
  p: number,
  o: number,
  g: number,
): IDBKeyRange {
  return IDBKeyRange.only([s, p, o, g]);
}

/**
 * Build the key array for inserting into the spo index.
 */
export function spoKey(s: number, p: number, o: number, g: number): number[] {
  return [s, p, o, g];
}

/**
 * Build the key array for inserting into the ops index.
 */
export function opsKey(s: number, p: number, o: number, g: number): number[] {
  return [o, p, s, g];
}

/**
 * Build the key array for inserting into the pso index.
 */
export function psoKey(s: number, p: number, o: number, g: number): number[] {
  return [p, s, o, g];
}
