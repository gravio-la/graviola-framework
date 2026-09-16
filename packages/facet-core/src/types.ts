import type { FacetMode, ScopePointer } from "@graviola/search-facet-schema";

export type FacetValueType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date-time"
  | "entity";

export type FacetDescriptor = {
  scope: ScopePointer;
  typeName: string;
  field: string;
  mode: FacetMode;
  valueType: FacetValueType;
  label: string;
  kind?: string;
  order: number;
  multi: boolean;
  maxValues?: number;
  quick: boolean;
  numericField?: string;
};

export type FacetTermSelection = {
  kind: "terms";
  values: (string | number | boolean)[];
};

export type FacetRangeSelection = {
  kind: "range";
  gte?: number | string;
  lte?: number | string;
};

export type FacetScopeSelection = FacetTermSelection | FacetRangeSelection;

/** Selection keyed by JSON Schema scope pointer (unique per type+field). */
export type FacetSelection = Record<ScopePointer, FacetScopeSelection>;

export type FacetableFieldSpec = {
  field: string;
  mode: FacetMode;
};

export type AvailableFacets = Record<string, FacetableFieldSpec[]>;
