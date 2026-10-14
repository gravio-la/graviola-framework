import React from "react";
import { Typography } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { CompactNumericSpan } from "../components/CompactNumericSpan";
import { formatLocalizedNumber } from "../value-renderers/LocalizedNumberValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function NumberValue({ data }: { data: unknown }) {
  return <CompactNumericSpan>{formatLocalizedNumber(data)}</CompactNumericSpan>;
}

function numberFallback({ data }: DetailRendererProps) {
  return <NumberValue data={data} />;
}

export function NumberRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, numberFallback);
}
