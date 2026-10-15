import type { TFunction } from "i18next";

/**
 * When react-i18next has no initialized instance, `defaultValue` is returned
 * without interpolating `{{var}}` placeholders. Fill those manually when needed.
 */
export function tWithDefaultInterpolation(
  t: TFunction,
  key: string,
  defaultValue: string,
  interpolation?: Record<string, string | undefined>,
): string {
  const translated = t(key, { defaultValue, ...interpolation }) as string;
  if (!interpolation) {
    return translated;
  }
  let result = translated;
  for (const [name, value] of Object.entries(interpolation)) {
    if (value !== undefined && result.includes(`{{${name}}}`)) {
      result = result.split(`{{${name}}}`).join(value);
    }
  }
  return result;
}
