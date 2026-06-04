import React from "react";
import type { ControlElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "./ContainedEntityView";
import { PropertyRow } from "./PropertyRow";

/** Schema-typed entity refs render as contained chips; `@id` makes them clickable. */
export function NamedEntityRenderer({
  label,
  data,
  schema,
  uiSchema,
  ctx,
}: DetailRendererProps) {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const containedAs = containedAsFromUiSchema(
    uiSchema as ControlElement,
    "chip",
  );
  return (
    <PropertyRow label={label}>
      <ContainedEntityView
        data={d}
        schema={schema as JSONSchema7}
        containedAs={containedAs}
        ctx={ctx}
      />
    </PropertyRow>
  );
}
