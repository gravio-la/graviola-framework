const STORAGE_KEY = "graviola:calc-debug";

/** KISS toggle: `localStorage` or `?calcDebug=1` / `?calcDebug=0`. */
export function isCalcDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const fromQuery = new URLSearchParams(window.location.search).get(
    "calcDebug",
  );
  if (fromQuery === "1" || fromQuery === "true") return true;
  if (fromQuery === "0" || fromQuery === "false") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setCalcDebugEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

export function calcDebug(...args: unknown[]): void {
  if (!isCalcDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.debug("[graviola:calc]", ...args);
}
