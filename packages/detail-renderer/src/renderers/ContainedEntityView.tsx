import React, { useMemo } from "react";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import {
  buildDispatch,
  generateDefaultViewUISchema,
  type DetailTesterContext,
  type ViewSize,
} from "@graviola/edb-detail-renderer-core";
import { extractEntityPreview } from "@graviola/edb-core-utils";
import { rootFrame } from "@graviola/json-schema-utils";

import { useDetailRendererContext } from "../context";
import { useEntityRefClickHandler } from "../hooks/useEntityRefClickHandler";
import {
  defaultCardRenderers,
  defaultChipRenderers,
  defaultDetailRenderers,
  defaultListItemRenderers,
} from "./registries";
import { InlineEntityRefChip } from "./InlineEntityRefChip";

const REGISTRY_BY_SIZE = {
  chip: defaultChipRenderers,
  listItem: defaultListItemRenderers,
  card: defaultCardRenderers,
  detail: defaultDetailRenderers,
} as const;

export type ContainedEntityViewProps = {
  data: Record<string, unknown>;
  schema?: JSONSchema7;
  containedAs?: ViewSize;
  ctx: DetailTesterContext;
  onClick?: () => void;
};

/** Renders a related entity at the requested view size (chip, card, …). */
export function ContainedEntityView({
  data,
  schema: schemaProp,
  containedAs = "chip",
  ctx,
  onClick,
}: ContainedEntityViewProps) {
  const { containedEntityComponents, config, rootSchema } =
    useDetailRendererContext();
  const createEntityClick = useEntityRefClickHandler();

  const entityIRI =
    typeof data["@id"] === "string" && data["@id"].length > 0
      ? data["@id"]
      : undefined;
  const typeIRI =
    typeof data["@type"] === "string" ? data["@type"] : ctx.typeIRI;
  const resolvedOnClick =
    onClick ??
    (entityIRI ? createEntityClick(entityIRI, typeIRI, data) : undefined);

  const Injected = containedEntityComponents?.[containedAs];
  if (Injected) {
    return (
      <Injected
        data={data}
        schema={schemaProp}
        typeIRI={typeIRI}
        entityIRI={entityIRI}
        onClick={resolvedOnClick}
      />
    );
  }

  if (containedAs === "chip") {
    return (
      <InlineEntityRefChip data={data} ctx={ctx} onClick={resolvedOnClick} />
    );
  }

  const schema = schemaProp ?? (ctx.rootSchema as JSONSchema7 | undefined);
  if (!schema) return null;

  const typeName =
    (typeIRI && ctx.typeIRIToTypeName?.(typeIRI)) ?? ctx.typeName;
  const primaryFields = config.primaryFields;
  const pf = typeName ? primaryFields?.[typeName] : undefined;
  const preview = extractEntityPreview({
    data,
    typeName,
    primaryFields,
  });

  const registry = REGISTRY_BY_SIZE[containedAs];
  const uiSchema = generateDefaultViewUISchema(containedAs, schema, pf, {
    layoutType:
      containedAs === "detail" ? "TopLevelLayout" : `${containedAs}Layout`,
    rootSchema: schema,
  });

  const childCtx: DetailTesterContext = useMemo(
    () => ({
      ...ctx,
      rootSchema: schema,
      viewSize: containedAs,
      frame: rootFrame(schema),
      typeIRI,
      typeName,
      preview,
      headerPreview: {
        label: preview.label ?? null,
        description: preview.description ?? null,
        image: preview.image ?? null,
      },
      entityIRI: typeof data["@id"] === "string" ? data["@id"] : ctx.entityIRI,
      depth: (ctx.depth ?? 0) + 1,
    }),
    [ctx, schema, containedAs, typeIRI, typeName, preview, data],
  );

  const body = useMemo(() => {
    const run = buildDispatch(registry, schema, data, childCtx);
    return run(uiSchema);
  }, [registry, schema, data, childCtx, uiSchema]);

  return <>{body}</>;
}

export function containedAsFromUiSchema(
  uiSchema: ControlElement | undefined,
  fallback: ViewSize = "chip",
): ViewSize {
  const raw = uiSchema?.options?.containedAs;
  if (
    raw === "chip" ||
    raw === "listItem" ||
    raw === "card" ||
    raw === "detail"
  ) {
    return raw;
  }
  return fallback;
}
