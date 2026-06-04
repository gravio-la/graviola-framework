import maxBy from "lodash-es/maxBy";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import { isControl } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type { UISchemaElement } from "@jsonforms/core";

import type { DetailTesterContext } from "../types";
import {
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
  type ValueRendererEntry,
} from "./types";

const TESTER_NOT_APPLICABLE = -1;

function readControlOptions(
  uiSchema: UISchemaElement | undefined,
): Record<string, unknown> | undefined {
  if (!uiSchema || !isControl(uiSchema)) return undefined;
  const opts = (uiSchema as ControlElement).options;
  return opts && typeof opts === "object"
    ? (opts as Record<string, unknown>)
    : undefined;
}

function findByName(
  registry: ValueRendererEntry[],
  name: string,
): ValueRendererEntry | null {
  return registry.find((e) => e.name === name) ?? null;
}

function pickByTester(
  registry: ValueRendererEntry[],
  uiSchema: UISchemaElement,
  schema: JSONSchema7,
  ctx: DetailTesterContext,
): ValueRendererEntry | null {
  const testerCtx = {
    rootSchema: ctx.rootSchema as JsonSchema,
    config: ctx,
  };

  const best = maxBy(registry, (entry) =>
    entry.tester(uiSchema as never, schema as never, testerCtx as never),
  );
  if (!best) return null;
  const rank = best.tester(
    uiSchema as never,
    schema as never,
    testerCtx as never,
  );
  return rank > TESTER_NOT_APPLICABLE ? best : null;
}

/**
 * Resolve a value renderer for a Control:
 * 1. UI schema `options.valueRenderer` by name
 * 2. Highest-ranked tester match
 */
export function pickValueRenderer(
  registry: ValueRendererEntry[],
  uiSchema: UISchemaElement | undefined,
  schema: JSONSchema7,
  ctx: DetailTesterContext,
): ValueRendererEntry | null {
  if (!registry.length || !uiSchema) return null;

  const controlOptions = readControlOptions(uiSchema);
  const explicitName = controlOptions?.[VALUE_RENDERER_OPTION];
  if (typeof explicitName === "string" && explicitName.length > 0) {
    return findByName(registry, explicitName);
  }

  return pickByTester(registry, uiSchema, schema, ctx);
}

export function readValueRendererOptions(
  uiSchema: UISchemaElement | undefined,
): Record<string, unknown> | undefined {
  const controlOptions = readControlOptions(uiSchema);
  const raw = controlOptions?.[VALUE_RENDERER_OPTIONS_KEY];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return undefined;
}
