import type { EntityOf, SchemaRegistry } from "../registry";
import type { StoreListQuery } from "../query";

export interface Streams<R extends SchemaRegistry> {
  streamList<T extends keyof R & string>(
    typeName: T,
    limit?: number,
    query?: StoreListQuery,
  ): AsyncIterable<EntityOf<R, T>>;
}
