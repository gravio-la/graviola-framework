import type { StoreId } from "./ids";

/** ISO-8601 timestamp string */
export type ISO8601 = string;

export type FreshnessState = "fresh" | "stale" | "unknown";

/**
 * Document-level read envelope (opt-in via `loadOne(..., { withMeta: true })`).
 * Triple-level provenance inside a federator registry is a separate concern.
 */
export type ReadResult<T> = {
  data: T;
  provenance: {
    sources: StoreId[];
    fetchedAt: ISO8601;
    freshness: FreshnessState;
  };
  completeness?: {
    type: string;
    filterFingerprint: string;
    totalKnown: number | null;
    totalReturned: number;
    complete: boolean;
  };
  cost?: {
    simulatedCapabilities: string[];
    estimatedClass: "O(1)" | "O(n)" | "O(network)";
  };
};
