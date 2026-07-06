/**
 * Storybook cross-links use manager-shell `./?path=` URLs.
 * Bare `?path=` links inside the docs iframe resolve to `iframe.html?path=`
 * and show a blank page on GitHub Pages — always target the manager shell.
 */
export function storybookPathQuery(entryId: string, hash?: string): string {
  const segment = entryId.endsWith("--docs") ? "docs" : "story";
  const url = `./?path=/${segment}/${entryId}`;
  if (!hash) return url;
  return `${url}${hash.startsWith("#") ? hash : `#${hash}`}`;
}

/** Relative manager href from the docs iframe or manager shell. */
export function storybookHref(entryId: string, hash?: string): string {
  return storybookPathQuery(entryId, hash);
}

/** Alias when the target is a docs entry (`*--docs`). */
export const storybookDocsHref = storybookHref;

export type LocationLike = Pick<Location, "origin" | "pathname">;

/** Extract `?path=…` (and optional hash) from Storybook link href variants. */
export function extractStorybookPathQuery(href: string): string | null {
  if (href.startsWith("?path=")) return href;
  const idx = href.indexOf("?path=");
  if (idx >= 0) return href.slice(idx);
  return null;
}

/** True when href is an internal Storybook navigation link. */
export function isStorybookInternalHref(href: string): boolean {
  if (!href || href.startsWith("#") || /^https?:\/\//.test(href)) {
    return false;
  }
  return extractStorybookPathQuery(href) !== null;
}

/**
 * Resolve MDX / dashboard links to an absolute manager URL.
 * Accepts `./?path=…`, `?path=…`, or legacy `./index.html?path=…`.
 */
export function resolveStorybookManagerHref(
  href: string,
  baseLocation?: LocationLike,
): string {
  if (!href || /^https?:\/\//.test(href) || href.startsWith("#")) {
    return href;
  }

  const pathQuery = extractStorybookPathQuery(href);
  if (!pathQuery) return href;

  const loc =
    baseLocation ??
    (typeof window !== "undefined"
      ? (window.parent?.location ?? window.location)
      : { origin: "", pathname: "/" });

  let basePath = loc.pathname
    .replace(/\/iframe\.html$/, "/")
    .replace(/\/index\.html$/, "/");
  if (!basePath.endsWith("/")) basePath += "/";

  return `${loc.origin}${basePath}${pathQuery}`;
}
