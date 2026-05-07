import type { RDFSelectResult } from "@graviola/edb-core-types";
import type { EntityOf, SchemaRegistry } from "../registry";
import type { StoreListQuery } from "../query";

/**
 * Optional fast-path capability for stores that can return flat SPARQL SELECT bindings.
 * Useful for table/list UIs on triple stores where JSON reconstruction is avoidable cost.
 */
export interface FlatResultSet<R extends SchemaRegistry> {
  findDocumentsAsFlatResultSet<T extends keyof R & string>(
    typeName: T,
    query?: StoreListQuery,
    limit?: number,
  ): Promise<RDFSelectResult>;
}
