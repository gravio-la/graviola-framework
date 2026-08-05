/**
 * URL for a file in Vite `public/`, correct when the app is served under a subpath
 * (e.g. GitHub Pages: `VITE_BASE_PATH=/repo/testapp/`).
 * Outside Vite (Bun seed/CLI), falls back to `/`.
 */
export function publicAssetUrl(path: string): string {
  const base =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
    "/";
  const trimmed = path.replace(/^\/+/, "");
  return `${base.endsWith("/") ? base : `${base}/`}${trimmed}`;
}
