import type { TypedWhereInput } from "@graviola/typed-query-types";
import type { EntityOf, SchemaRegistry } from "../registry";

/** Facet bucket from Aggregates capability */
export type FacetBucket = {
  value: string | number | boolean;
  count: number;
};

export type FacetResult = {
  matched: number;
  facets: Record<string, FacetBucket[]>;
};

export interface Aggregates<R extends SchemaRegistry> {
  facet<T extends keyof R & string>(
    typeName: T,
    options: {
      where?: TypedWhereInput<EntityOf<R, T>>;
      facets: string[];
      limit?: number;
    },
  ): Promise<FacetResult>;
}
