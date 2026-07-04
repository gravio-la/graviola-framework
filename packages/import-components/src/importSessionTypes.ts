/** Default REST API root for import session client (override via env in apps). */
export const DEFAULT_REST_API_BASE =
  typeof import.meta !== "undefined" &&
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_REST_API_BASE
    ? String(
        (import.meta as ImportMeta & { env?: Record<string, string> }).env!
          .VITE_REST_API_BASE,
      )
    : "http://localhost:8787";

export let restApiBase = DEFAULT_REST_API_BASE;

export function configureRestApiBase(base: string): void {
  restApiBase = base.replace(/\/+$/, "");
}
