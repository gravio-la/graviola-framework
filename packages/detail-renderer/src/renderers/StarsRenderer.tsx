import Rating from "@mui/material/Rating";
import { optionIs, type RankedTester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { PropertyRow } from "./PropertyRow";

/** Presentational stars — reusable in cards and control renderers. */
export function StarsRating({
  value,
  max = 5,
}: {
  value: number | null | undefined;
  max?: number;
}) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return (
    <Rating
      name="stars-readonly"
      value={Number(value)}
      max={max}
      readOnly
      size="small"
    />
  );
}

function isBoundedSmallInteger(schema: JSONSchema7): boolean {
  return (
    schema.type === "integer" &&
    typeof schema.minimum === "number" &&
    typeof schema.maximum === "number" &&
    schema.minimum >= 1 &&
    schema.maximum <= 5
  );
}

/**
 * Structural tester: small bounded integers (1–5) render as stars.
 * Opt-in via uiSchema `options.widget === "stars"` when bounds are absent.
 */
export const starsTester: RankedTester = (ui, schema, ctx) => {
  if (isBoundedSmallInteger(schema as JSONSchema7)) return 50;
  return optionIs("widget", "stars")(ui, schema, ctx) ? 50 : -1;
};

export function StarsRenderer({ label, data, schema }: DetailRendererProps) {
  const max =
    typeof (schema as JSONSchema7).maximum === "number"
      ? ((schema as JSONSchema7).maximum as number)
      : 5;
  return (
    <PropertyRow label={label}>
      <StarsRating value={typeof data === "number" ? data : null} max={max} />
    </PropertyRow>
  );
}
