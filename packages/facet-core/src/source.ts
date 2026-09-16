import type {
  Aggregates,
  BaseStore,
  DocumentSearches,
  SchemaRegistry,
} from "@graviola/store-core";
import { hasCapability } from "@graviola/store-core";

export type FacetedSearchStore<R extends SchemaRegistry = SchemaRegistry> =
  BaseStore<R> & DocumentSearches<R> & Partial<Aggregates<R>>;

export function canDocumentSearch(
  store: BaseStore<SchemaRegistry> | null | undefined,
): store is BaseStore<SchemaRegistry> & DocumentSearches<SchemaRegistry> {
  return Boolean(store && hasCapability(store, "documentSearches"));
}

export function canFacet(
  store: BaseStore<SchemaRegistry> | null | undefined,
): boolean {
  return Boolean(
    store &&
    (hasCapability(store, "documentSearches") ||
      hasCapability(store, "aggregates")),
  );
}
