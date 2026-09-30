/**
 * Guard LIMIT/OFFSET-style numeric parameters before SPARQL interpolation.
 */
export function assertNonNegativeInteger(name: string, value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${name} must be a non-negative integer, got ${String(value)}`,
    );
  }
  return value;
}
