/**
 * URL for a file in Vite `public/`, correct when the app is served under a subpath
 * (e.g. GitHub Pages: `VITE_BASE_PATH=/repo/testapp/`).
 */
export function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const trimmed = path.replace(/^\/+/, "");
  return `${base}${trimmed}`;
}
