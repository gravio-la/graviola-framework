import type { HostPolicy } from "../types";

type Bucket = {
  lastAt: number;
  windowStart: number;
  windowCount: number;
  policy: HostPolicy;
};

export type RateLimiter = {
  acquire: (host: string) => Promise<void>;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const createRateLimiter = (
  policies: Record<string, HostPolicy> = {},
  defaultPolicy: HostPolicy = { minIntervalMs: 0 },
): RateLimiter => {
  const buckets = new Map<string, Bucket>();

  const getBucket = (host: string): Bucket => {
    let b = buckets.get(host);
    if (!b) {
      b = {
        lastAt: 0,
        windowStart: Date.now(),
        windowCount: 0,
        policy: policies[host] ?? defaultPolicy,
      };
      buckets.set(host, b);
    }
    return b;
  };

  return {
    acquire: async (host: string) => {
      const b = getBucket(host);
      const now = Date.now();

      if (b.policy.max != null && b.policy.windowMs != null) {
        if (now - b.windowStart >= b.policy.windowMs) {
          b.windowStart = now;
          b.windowCount = 0;
        }
        if (b.windowCount >= b.policy.max) {
          const wait = b.policy.windowMs - (now - b.windowStart);
          if (wait > 0) await sleep(wait);
          b.windowStart = Date.now();
          b.windowCount = 0;
        }
      }

      const min = b.policy.minIntervalMs ?? 0;
      if (min > 0) {
        const elapsed = Date.now() - b.lastAt;
        if (elapsed < min) await sleep(min - elapsed);
      }

      b.lastAt = Date.now();
      b.windowCount += 1;
    },
  };
};

/** Common host policies from the plan. */
export const DEFAULT_HOST_POLICIES: Record<string, HostPolicy> = {
  "nominatim.openstreetmap.org": { minIntervalMs: 1000 },
  "overpass-api.de": { minIntervalMs: 1000 },
  "lz4.overpass-api.de": { minIntervalMs: 1000 },
  "overpass.kumi.systems": { minIntervalMs: 1000 },
  "www.abgeordnetenwatch.de": { max: 30, windowMs: 60_000 },
  oparl: { minIntervalMs: 200 },
  "dev.oparl.org": { minIntervalMs: 200 },
};
