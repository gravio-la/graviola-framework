import React from "react";
import { encode, type JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import {
  buildDispatch,
  generateDefaultDetailUISchema,
  type DetailRendererRegistryEntry,
  type DetailTesterContext,
  type GenerateDefaultDetailUISchemaOptions,
} from "@graviola/edb-detail-renderer-core";

/**
 * Preserve JSON Schema `#/definitions` (or `$defs`) from the enclosing document when
 * using a subgraph as its own synthetic root — needed so nested `$ref` still resolve.
 */
export function itemVirtualRoot(
  itemSchema: JSONSchema7,
  fullRoot: JSONSchema7,
): JSONSchema7 {
  const defs =
    fullRoot.definitions ??
    (fullRoot as { $defs?: JSONSchema7["definitions"] }).$defs;
  if (!defs || typeof defs !== "object") return itemSchema;
  return {
    ...itemSchema,
    definitions: defs as JSONSchema7["definitions"],
  };
}

/** Technical RDF keys usually omitted when rendering anonymous inline objects. */
const defaultInlineDetailSkipScopes: string[] = [
  `#/properties/${encode("@id")}`,
  `#/properties/${encode("@type")}`,
];

export type RenderDetailInlineObjectBodyGenerateOptions = Pick<
  GenerateDefaultDetailUISchemaOptions,
  "skipScope" | "scopeOverride"
> & {
  /**
   * When `false`, do not prepend default skips for `#/properties/@id` / `@type`.
   * Omit or `true` (default): merge those skips before the caller `skipScope` list.
   */
  includeDefaultTechnicalSkips?: boolean;
};

/**
 * Full detail dispatch for one JSON object shaped by `virtualRootSchema` (must include
 * `definitions` merged from {@link itemVirtualRoot} when items use `#/definitions/...`).
 */
export function renderDetailInlineObjectBody({
  registry,
  virtualRootSchema,
  itemData,
  ctx,
  extraGenerateDetailOptions,
}: {
  registry: DetailRendererRegistryEntry[];
  virtualRootSchema: JSONSchema7;
  itemData: Record<string, unknown>;
  ctx: DetailTesterContext;
  /** UISchema generation tweaks; omit entirely when no extra skips/overrides apply. */
  extraGenerateDetailOptions?: RenderDetailInlineObjectBodyGenerateOptions;
}): React.ReactNode {
  const run = buildDispatch(registry, virtualRootSchema, itemData, {
    ...ctx,
    depth: ctx.depth + 1,
  });

  const prependTechnicalSkips =
    extraGenerateDetailOptions?.includeDefaultTechnicalSkips !== false;

  const uiSchema = generateDefaultDetailUISchema(
    virtualRootSchema as JsonSchema,
    {
      layoutType: "VerticalLayout",
      prefix: "#",
      rootSchema: virtualRootSchema as JsonSchema,
      skipScope: [
        ...(prependTechnicalSkips ? defaultInlineDetailSkipScopes : []),
        ...(extraGenerateDetailOptions?.skipScope ?? []),
      ],
      scopeOverride: {
        ...(extraGenerateDetailOptions?.scopeOverride ?? {}),
      },
    },
  );
  return run(uiSchema);
}
