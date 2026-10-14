/** Whether instance data should count as a visible detail field value. */
export function detailDataHasValue(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.keys(value as object).length > 0;
  }
  return true;
}
