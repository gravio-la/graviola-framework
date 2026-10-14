/** Link text for URI values: optional label, else hostname with a short path hint. */
export function formatUriLinkText(href: string, label?: string): string {
  const trimmed = label?.trim();
  if (trimmed) return trimmed;

  try {
    const u = new URL(href);
    const host = u.host;
    let path = u.pathname + u.search;
    if (!path || path === "/") {
      return host;
    }
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    const looksLikeOpaqueId =
      /^(id=)?[a-f0-9-]{20,}$/i.test(last) || /^[a-f0-9]{24}$/i.test(last);
    if (looksLikeOpaqueId || last.length > 48) {
      const hint = path.length > 24 ? `${path.slice(0, 21)}…` : path;
      return `${host}${hint}`;
    }
    const shortPath = path.length > 32 ? `${path.slice(0, 29)}…` : path;
    return `${host}${shortPath}`;
  } catch {
    return href;
  }
}
