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

  return assetKindForRef(kindCtx, schema);
}
