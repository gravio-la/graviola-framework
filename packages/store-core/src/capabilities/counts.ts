import type { SchemaRegistry } from "../registry";
import type { StoreListQuery } from "../query";

export interface Counts<_R extends SchemaRegistry> {
  count(
    typeName: string,
    query?: Pick<StoreListQuery, "search" | "insensitive">,
  ): Promise<number>;
}
