/**
 * Storybook cross-links use relative `?path=` query strings (official Storybook MDX style).
 * Works locally and on GitHub Pages when `config.base` is set in viteFinal.
 */
export function storybookHref(entryId: string, hash?: string): string {
  const segment = entryId.endsWith("--docs") ? "docs" : "story";
  const url = `?path=/${segment}/${entryId}`;
  if (!hash) return url;
  return `${url}${hash.startsWith("#") ? hash : `#${hash}`}`;
}

/** Alias when the target is a docs entry (`*--docs`). */
export const storybookDocsHref = storybookHref;
