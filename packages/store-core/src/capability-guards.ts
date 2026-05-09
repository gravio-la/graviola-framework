import type { Aggregates } from "./capabilities/aggregates";
import type { Counts } from "./capabilities/counts";
import type { Exists } from "./capabilities/exists";
import type { Filters } from "./capabilities/filters";
import type { FlatResultSet } from "./capabilities/flat-result-set";
import type { Identifies } from "./capabilities/identifies";
import type { Imports } from "./capabilities/imports";
import type { Lists } from "./capabilities/lists";
import type { Loads } from "./capabilities/loads";
import type { Removes } from "./capabilities/removes";
import type { Resolves } from "./capabilities/resolves";
import type { Searches } from "./capabilities/searches";
import type { SpeaksNative } from "./capabilities/speaks-native";
import type { Streams } from "./capabilities/streams";
import type { TextSearches } from "./capabilities/text-searches";
import type { Writes } from "./capabilities/writes";
import type { CapabilityName } from "./descriptor";
import type { SchemaRegistry } from "./registry";
import type { BaseStore } from "./store";

/**
 * Maps each runtime capability flag to the Store TypeScript facet that must be
 * present when that flag is set.
 */
export type CapabilityFacets<R extends SchemaRegistry> = {
  identifies: Identifies;
  loads: Loads<R>;
  lists: Lists<R>;
  flatResultSet: FlatResultSet<R>;
  filters: Filters<R>;
  searches: Searches<R>;
  counts: Counts<R>;
  writes: Writes<R>;
  removes: Removes<R>;
  streams: Streams<R>;
  imports: Imports<R>;
  textSearches: TextSearches;
  aggregates: Aggregates<R>;
  speaksNative: SpeaksNative<string, unknown>;
  resolves: Resolves;
  exists: Exists<R>;
};

/**
 * Narrows a store type when a capability is known to be advertised.
 */
export type StoreWithCapability<
  R extends SchemaRegistry,
  S,
  N extends CapabilityName,
> = S & CapabilityFacets<R>[N];

/**
 * Runtime + type-level capability probe. Prefer this over inspecting
 * `store.capabilities` directly so optional facets (e.g. {@link Counts})
 * narrow correctly after the check.
 */
export function hasCapability<
  R extends SchemaRegistry,
  S extends BaseStore<R>,
  N extends CapabilityName,
>(store: S, name: N): store is StoreWithCapability<R, S, N> {
  if (name === "identifies") return store.capabilities.identifies === true;
  return Boolean(store.capabilities[name]);
}
