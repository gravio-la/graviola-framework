/**
 * Storybook cross-links use manager-shell `index.html?path=` URLs.
 * Relative `?path=` links inside the docs iframe resolve to `iframe.html?path=`
 * and show a blank page on GitHub Pages — always target the manager shell.
 */
export function storybookPathQuery(entryId: string, hash?: string): string {
  const segment = entryId.endsWith("--docs") ? "docs" : "story";
  const url = `?path=/${segment}/${entryId}`;
  if (!hash) return url;
  return `${url}${hash.startsWith("#") ? hash : `#${hash}`}`;
}

/** Relative manager href (works when the current page is already index.html). */
export function storybookHref(entryId: string, hash?: string): string {
  return `./index.html${storybookPathQuery(entryId, hash)}`;
}

/** Alias when the target is a docs entry (`*--docs`). */
export const storybookDocsHref = storybookHref;

type LocationLike = Pick<Location, "origin" | "pathname">;

/**
 * Resolve MDX / dashboard links to an absolute manager URL.
 * Accepts `./index.html?path=…`, bare `?path=…`, or legacy relative paths.
 */
export function resolveStorybookManagerHref(
  href: string,
  baseLocation?: LocationLike,
): string {
  if (!href || /^https?:\/\//.test(href) || href.startsWith("#")) {
    return href;
  }

  const pathQuery = href.startsWith("?path=")
    ? href
    : href.includes("?path=")
      ? href.slice(href.indexOf("?path="))
      : null;

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

  return `${loc.origin}${basePath}index.html${pathQuery}`;
}
