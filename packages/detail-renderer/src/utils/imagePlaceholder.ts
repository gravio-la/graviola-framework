/** Pure helper for broken image UI (SSR tests + client onError). */
export function shouldUseImagePlaceholder(
  loadFailed: boolean,
  src: string | undefined,
): boolean {
  if (loadFailed) return true;
  if (src == null || src.trim() === "") return true;
  return false;
}
