type ImportMetaEnv = {
  STORYBOOK_BASE_PATH?: string;
  VITE_BASE_PATH?: string;
};

/** Base path for Storybook static assets on GitHub Pages (no trailing slash). */
export function storybookPublicBasePath(): string {
  const env = (import.meta as { env?: ImportMetaEnv }).env;
  const base = env?.STORYBOOK_BASE_PATH || env?.VITE_BASE_PATH || "";
  return base.replace(/\/+$/, "");
}

/**
 * Resolve a path under Storybook `public/` (e.g. `/fixtures/foo.jpg`).
 * Empty base in local dev → root-relative URL; Pages build → subpath-prefixed URL.
 */
export function storybookPublicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = storybookPublicBasePath();
  return base ? `${base}${normalized}` : normalized;
}
