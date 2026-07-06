/** Resolve audio URLs for stable comparison (element.src is always absolute). */
export function resolveAudioUrl(url: string, base?: string): string {
  try {
    const baseHref =
      base ??
      (typeof window !== "undefined" ? window.location.href : undefined);
    if (baseHref) {
      return new URL(url, baseHref).href;
    }
  } catch {
    // fall through
  }
  return url;
}

export function sameAudioUrl(a: string, b: string, base?: string): boolean {
  return resolveAudioUrl(a, base) === resolveAudioUrl(b, base);
}
