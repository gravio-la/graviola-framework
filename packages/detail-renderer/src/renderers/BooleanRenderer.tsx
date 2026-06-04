import React from "react";
import { Checkbox } from "@mui/material";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { BooleanValueRenderer } from "../value-renderers/BooleanValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function booleanFallback(props: DetailRendererProps) {
  return (
    <BooleanValueRenderer
      value={props.data}
      schema={props.schema}
      ctx={props.ctx}
    />
  );
}

export function BooleanRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, booleanFallback);
}
