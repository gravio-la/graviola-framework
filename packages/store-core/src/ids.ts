/** Opaque store identifier for provenance and routing */
export type StoreId = string & { readonly __brand?: "StoreId" };
