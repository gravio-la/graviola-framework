import React from "react";
import { Rating } from "@mui/material";
import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";

export function FiveStarValueRenderer({ value }: ValueRendererProps) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return (
    <Rating value={Math.min(5, Math.max(0, n))} max={5} readOnly size="small" />
  );
}

export const fiveStarValueRendererEntry: ValueRendererEntry = {
  name: "fiveStar",
  tester: () => -1,
  renderer: FiveStarValueRenderer,
};
