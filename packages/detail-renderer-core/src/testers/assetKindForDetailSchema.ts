import { extractTypeIRI } from "@graviola/json-schema-utils";
import { assetKindForRef, type AssetKind } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

import type { DetailTesterContext } from "../types";

function assetKindContext(ctx: DetailTesterContext | undefined) {
  if (!ctx?.assetClasses || !ctx.schemaRegistry) return undefined;
  return {
    config: {
      assetClasses: ctx.assetClasses,
      registry: ctx.schemaRegistry,
    },
  };
}

/**
 * Resolve asset kind for a control schema after JSON Forms / detail dispatch
 * resolution (may be inlined entity shape, not a bare `$ref`).
 */
export function assetKindForDetailSchema(
  ctx: DetailTesterContext | undefined,
  schema: JSONSchema7,
): AssetKind | undefined {
  const kindCtx = assetKindContext(ctx);
  if (!kindCtx) return undefined;

  const fromRef = assetKindForRef(kindCtx, schema);
  if (fromRef) return fromRef;

  const registry = ctx!.schemaRegistry!;
  const typeIRI = extractTypeIRI(schema);
  if (typeIRI) {
    const entry = registry.byTypeIRI.get(typeIRI);
    if (entry && ctx!.assetClasses![entry.name]) {
      return ctx!.assetClasses![entry.name];
    }
  }

  if (schema.type === "array") {
    const items = schema.items;
    if (items && typeof items === "object" && !Array.isArray(items)) {
      return assetKindForDetailSchema(ctx, items as JSONSchema7);
    }
  }

  return undefined;
}
