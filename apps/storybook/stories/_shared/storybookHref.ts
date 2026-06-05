/**
 * Storybook dev and static builds route via `?path=/docs/<id>` or `?path=/story/<id>`.
 * Plain `/docs/...` hrefs 404 under the Vite dev server.
 */
export function storybookBasePath(): string {
  const env = import.meta as {
    env?: { STORYBOOK_BASE_PATH?: string; VITE_BASE_PATH?: string };
  };
  const raw = env.env?.STORYBOOK_BASE_PATH ?? env.env?.VITE_BASE_PATH ?? "";
  return raw.replace(/\/+$/, "");
}

export function storybookHref(entryId: string, hash?: string): string {
  const segment = entryId.endsWith("--docs") ? "docs" : "story";
  const base = storybookBasePath();
  const prefix = base ? `${base}/` : "/";
  const url = `${prefix}?path=/${segment}/${entryId}`;
  if (!hash) return url;
  return `${url}${hash.startsWith("#") ? hash : `#${hash}`}`;
}

/** Alias when the target is a docs entry (`*--docs`). */
export const storybookDocsHref = storybookHref;
