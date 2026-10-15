import React from "react";
import { isControl } from "@jsonforms/core";
import type { ControlElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { AssetValueRenderer } from "../value-renderers/AssetValueRenderer";
import { PropertyRow } from "./PropertyRow";

export function AssetRefRenderer({
  label,
  data,
  schema,
  uiSchema,
  ctx,
}: DetailRendererProps) {
  if (data == null || data === "") return null;

  const controlUi =
    uiSchema && isControl(uiSchema) ? (uiSchema as ControlElement) : undefined;

  return (
    <PropertyRow label={label}>
      <AssetValueRenderer
        value={data}
        schema={schema}
        uiSchema={controlUi}
        ctx={ctx}
      />
    </PropertyRow>
  );
}
