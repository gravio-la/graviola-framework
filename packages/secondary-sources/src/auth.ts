import type { AcquisitionRuntime } from "@graviola/data-acquisition";
import { getViaSourcePath } from "@graviola/edb-data-mapping";

import type { AuthSpec } from "./types";

type TokenCacheEntry = { token: string; expiresAt: number };

const tokenCache = new Map<string, TokenCacheEntry>();

export type SecretsResolver = (secretRef: string) => string | undefined;

export const resolveSecret = (
  secretRef: string,
  secrets: SecretsResolver,
): string | undefined =>
  secrets(secretRef) ?? process.env[`SOURCE_SECRET_${secretRef}`];

export async function buildAuthHeaders(
  auth: AuthSpec | undefined,
  secrets: SecretsResolver,
  acquisition: AcquisitionRuntime,
  sourceId: string,
): Promise<Record<string, string>> {
  if (!auth || auth.mode === "none") return {};

  if (auth.mode === "bearer") {
    const token = resolveSecret(auth.secretRef, secrets);
    if (!token) throw new Error(`Missing secret for ${auth.secretRef}`);
    return { Authorization: `Bearer ${token}` };
  }

  if (auth.mode === "header") {
    const value = resolveSecret(auth.secretRef, secrets);
    if (!value) throw new Error(`Missing secret for ${auth.secretRef}`);
    return { [auth.header ?? "X-Api-Key"]: value };
  }

  if (auth.mode === "basic") {
    const value = resolveSecret(auth.secretRef, secrets);
    if (!value) throw new Error(`Missing secret for ${auth.secretRef}`);
    return { Authorization: `Basic ${Buffer.from(value).toString("base64")}` };
  }

  if (auth.mode !== "pre-login") return {};

  const cacheKey = `${sourceId}:pre-login`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      [auth.inject.header]: auth.inject.template.replace(
        "{{token}}",
        cached.token,
      ),
    };
  }

  const loginResult = await acquisition.fetch(auth.login, { input: {} });
  if (!loginResult.ok) {
    throw new Error(`Pre-login failed: ${loginResult.error.message}`);
  }
  const raw = loginResult.items[0] ?? loginResult.raw;
  const token = getViaSourcePath(raw, auth.tokenPath);
  if (typeof token !== "string" || !token) {
    throw new Error(`Pre-login token not found at ${auth.tokenPath}`);
  }

  const ttlMs = (auth.ttlSeconds ?? 3600) * 1000;
  tokenCache.set(cacheKey, { token, expiresAt: Date.now() + ttlMs });

  return {
    [auth.inject.header]: auth.inject.template.replace("{{token}}", token),
  };
}

/** Clear token cache (for tests). */
export function clearAuthTokenCache(): void {
  tokenCache.clear();
}
