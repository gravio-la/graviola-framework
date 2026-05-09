/** Join base URL and path segments without duplicating slashes. */
export const joinUrl = (base: string, ...segments: string[]): string => {
  const trimSlash = (s: string) => s.replace(/\/+$/, "");
  const root = trimSlash(base);
  const rest = segments
    .filter(Boolean)
    .map((s) => s.replace(/^\/+/, "").replace(/\/+$/, ""))
    .join("/");
  if (!rest) return root || "/";
  return `${root}/${rest}`;
};
