import type { EntityOf, SchemaRegistry } from "../registry";
import type { StoreListQuery } from "../query";

export interface Lists<R extends SchemaRegistry> {
  /**
   * Returns structured entities only — never SPARQL bindings or flat rows.
   */
  list<T extends keyof R & string>(
    typeName: T,
    limit?: number,
    query?: StoreListQuery,
  ): Promise<EntityOf<R, T>[]>;
}
