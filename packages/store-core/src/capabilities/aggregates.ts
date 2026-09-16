import type { TypedWhereInput } from "@graviola/typed-query-types";
import type { EntityOf, SchemaRegistry } from "../registry";
import type { FacetFilter, FacetStats } from "./document-searches";

/** Facet bucket from Aggregates capability */
export type FacetBucket = {
  value: string | number | boolean;
  count: number;
  /** Human label when value is an IRI or opaque id */
  label?: string;
};

export type FacetResult = {
  matched: number;
  facets: Record<string, FacetBucket[]>;
  facetStats?: Record<string, FacetStats>;
  /** True when counts are merged / capped and may double-count */
  approximate?: boolean;
};

export interface Aggregates<R extends SchemaRegistry> {
  facet<T extends keyof R & string>(
    typeName: T,
    options: {
      where?: TypedWhereInput<EntityOf<R, T>>;
      filters?: FacetFilter[];
      facets: string[];
      limit?: number;
    },
  ): Promise<FacetResult>;
}
