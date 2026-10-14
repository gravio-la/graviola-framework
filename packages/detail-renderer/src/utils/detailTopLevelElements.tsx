import React from "react";
import { decode, isControl, resolveSchema } from "@jsonforms/core";
import type { ControlElement, Layout, UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type {
  DetailDispatch,
  DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";
import { dataAtScope } from "@graviola/edb-detail-renderer-core";

import { DetailMetaStrip } from "../components/DetailMetaStrip";
import { detailDataHasValue } from "./detailDataValue";
import { isMetaStripEligibleControl } from "./detailSchemaPresentation";

function propertyNameFromScope(scope: string | undefined): string | undefined {
  if (!scope?.startsWith("#/properties/")) return undefined;
  const encoded = scope.slice("#/properties/".length);
  if (!encoded || encoded.includes("/")) return undefined;
  try {
    return decode(encoded);
  } catch {
    return encoded;
  }
}

function schemaForControl(
  control: ControlElement,
  rootSchema: JSONSchema7,
): JSONSchema7 | undefined {
  const resolved = resolveSchema(rootSchema, control.scope, rootSchema) as
    | JSONSchema7
    | undefined;
  return resolved;
}

type ElementGroup =
  | { kind: "single"; index: number; el: UISchemaElement }
  | { kind: "meta"; indices: number[]; elements: UISchemaElement[] };

export function groupTopLevelDetailElements(
  elements: UISchemaElement[],
  rootSchema: JSONSchema7,
  ctx: DetailTesterContext,
): ElementGroup[] {
  if (ctx.viewSize && ctx.viewSize !== "detail") {
    return elements.map((el, index) => ({ kind: "single", index, el }));
  }

  const groups: ElementGroup[] = [];
  let metaRun: UISchemaElement[] = [];
  let metaIndices: number[] = [];

  const flushMeta = () => {
    if (metaRun.length === 0) return;
    groups.push({
      kind: "meta",
      indices: metaIndices,
      elements: metaRun,
    });
    metaRun = [];
    metaIndices = [];
  };

  for (let index = 0; index < elements.length; index++) {
    const el = elements[index];
    if (isControl(el)) {
      const name = propertyNameFromScope(el.scope);
      const propSchema = schemaForControl(el, rootSchema);
      if (isMetaStripEligibleControl(el, propSchema, ctx, name)) {
        metaRun.push(el);
        metaIndices.push(index);
        continue;
      }
    }
    flushMeta();
    groups.push({ kind: "single", index, el });
  }
  flushMeta();
  return groups;
}

export function renderGroupedTopLevelElements(
  layout: Layout,
  elements: UISchemaElement[],
  dispatch: DetailDispatch,
  ctx: DetailTesterContext,
  rootData: unknown,
): React.ReactNode[] {
  const groups = groupTopLevelDetailElements(elements, ctx.rootSchema, ctx);

  return groups
    .map((group) => {
      if (group.kind === "meta") {
        const visible = group.elements.filter((el) => {
          if (!isControl(el)) return false;
          const scope = (el as ControlElement).scope;
          if (!scope) return false;
          return detailDataHasValue(dataAtScope(rootData, scope));
        });
        if (visible.length === 0) return null;
        return (
          <DetailMetaStrip key={`meta-${group.indices.join("-")}`}>
            {visible.map((el, i) => (
              <React.Fragment key={(el as ControlElement).scope ?? i}>
                {dispatch({ uiSchema: el, ctx })}
              </React.Fragment>
            ))}
          </DetailMetaStrip>
        );
      }
      return (
        <React.Fragment key={group.index}>
          {dispatch({ uiSchema: group.el, ctx })}
        </React.Fragment>
      );
    })
    .filter(Boolean);
}
