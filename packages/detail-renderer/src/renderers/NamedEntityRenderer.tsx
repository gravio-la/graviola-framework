import React from "react";
import type { ControlElement } from "@jsonforms/core";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";
import type { JSONSchema7 } from "json-schema";

import {
  ContainedEntityView,
  containedAsFromUiSchema,
} from "./ContainedEntityView";
import { useDetailPresentation } from "../detailPresentationContext";
import { useEntityRefClickHandler } from "../hooks/useEntityRefClickHandler";
import { InlineEntityRefChip } from "./InlineEntityRefChip";
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
  const { compactEntityLink } = useDetailPresentation();
  const createEntityClick = useEntityRefClickHandler();
  const entityIRI =
    typeof d["@id"] === "string" && d["@id"].length > 0 ? d["@id"] : undefined;
  const typeIRI = typeof d["@type"] === "string" ? d["@type"] : ctx.typeIRI;
  const onClick = entityIRI
    ? createEntityClick(entityIRI, typeIRI, d)
    : undefined;

  if (compactEntityLink) {
    return (
      <PropertyRow label={label}>
        <InlineEntityRefChip
          data={d}
          ctx={ctx}
          onClick={onClick}
          presentation="textLink"
          hideAvatar
        />
      </PropertyRow>
    );
  }

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
