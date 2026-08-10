import React, { Fragment, useMemo } from "react";
import type { ControlElement } from "@jsonforms/core";
import { encode } from "@jsonforms/core";
import {
  buildDispatch,
  groupRelationVia,
  readNestingOptions,
  readRelationViaOptions,
  resolvePropertySchema,
  resolveQualifierProperties,
  type DetailRendererProps,
  type DetailTesterContext,
  type RelationGroup,
  type RelationOccurrence,
  type ViewSize,
} from "@graviola/edb-detail-renderer-core";
import { extractEntityPreview } from "@graviola/edb-core-utils";
import { Box, Divider, Stack, Typography } from "@mui/material";
import type { JSONSchema7 } from "json-schema";

import { useDetailRendererContext } from "../context";
import { ContainedEntityView } from "./ContainedEntityView";
import { itemVirtualRoot } from "./detailInlineSubDispatch";
import { NestedSection } from "./NestedSection";
import { PropertyRow } from "./PropertyRow";
import { formatDateValue } from "../value-renderers/DateValueRenderer";

export type RelationViaAdornments = {
  /** Set-level slot, next to the section label. */
  renderSetAdornment?: () => React.ReactNode;
  renderTargetAdornment?: (group: RelationGroup) => React.ReactNode;
  renderOccurrenceAdornment?: (
    occ: RelationOccurrence,
    group: RelationGroup,
  ) => React.ReactNode;
};

export type RelationViaRendererProps = DetailRendererProps &
  RelationViaAdornments;

function readTargetSchema(
  itemSchema: JSONSchema7,
  targetPath: string,
  rootSchema: JSONSchema7,
): JSONSchema7 | undefined {
  // Single property segment only — dotted paths are rejected so callers get a
  // clear failure instead of a silently wrong schema.
  if (targetPath.includes(".")) return undefined;
  const propSchema = itemSchema.properties?.[targetPath];
  if (!propSchema || typeof propSchema === "boolean") return undefined;
  return resolvePropertySchema(propSchema as JSONSchema7, rootSchema);
}

function formatQualifierValue(
  value: unknown,
  propSchema: JSONSchema7 | undefined,
): string {
  if (value == null || value === "") return "";
  if (propSchema?.format === "date" || propSchema?.format === "date-time") {
    return formatDateValue(value);
  }
  return String(value);
}

function OccurrenceQualifiers({
  occ,
  itemSchema,
  virtualRoot,
  childCtx,
  options,
  registry,
}: {
  occ: RelationOccurrence;
  itemSchema: JSONSchema7;
  virtualRoot: JSONSchema7;
  childCtx: DetailTesterContext;
  options: NonNullable<ReturnType<typeof readRelationViaOptions>>;
  registry: import("@graviola/edb-detail-renderer-core").DetailRendererRegistryEntry[];
}) {
  const separator = options.qualifierSeparator ?? " – ";
  const emptyText = options.qualifierEmptyText ?? {};
  const qualifierProps = resolveQualifierProperties(itemSchema, options);

  if (options.occurrenceUiSchema) {
    const run = buildDispatch(registry, virtualRoot, occ.item, {
      ...childCtx,
      depth: childCtx.depth + 1,
    });
    return <>{run(options.occurrenceUiSchema)}</>;
  }

  const parts = qualifierProps
    .map((prop) => {
      const value = occ.item[prop];
      if (value == null || value === "") {
        const fallback = emptyText[prop];
        if (fallback) {
          return (
            <Typography
              key={prop}
              variant="body2"
              color="text.secondary"
              component="span"
            >
              {fallback}
            </Typography>
          );
        }
        return null;
      }

      const propSchema = itemSchema.properties?.[prop] as
        | JSONSchema7
        | undefined;
      const run = buildDispatch(registry, virtualRoot, occ.item, {
        ...childCtx,
        depth: childCtx.depth + 1,
      });
      const control: ControlElement = {
        type: "Control",
        scope: `#/properties/${encode(prop)}`,
        label: "",
      };
      const rendered = run(control);
      if (rendered != null) {
        return <Fragment key={prop}>{rendered}</Fragment>;
      }

      return (
        <Typography
          key={prop}
          variant="body2"
          color="text.secondary"
          component="span"
        >
          {formatQualifierValue(value, propSchema)}
        </Typography>
      );
    })
    .filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.25} alignItems="center" flexWrap="wrap">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <Typography variant="body2" color="text.secondary" component="span">
              {separator}
            </Typography>
          ) : null}
          {part}
        </Fragment>
      ))}
    </Stack>
  );
}

function RelationGroupRow({
  group,
  itemSchema,
  virtualRoot,
  rootSchema,
  childCtx,
  options,
  config,
  registry,
  renderTargetAdornment,
  renderOccurrenceAdornment,
}: {
  group: RelationGroup;
  itemSchema: JSONSchema7;
  virtualRoot: JSONSchema7;
  rootSchema: JSONSchema7;
  childCtx: DetailTesterContext;
  options: NonNullable<ReturnType<typeof readRelationViaOptions>>;
  config: import("../context").DetailRendererContextValue["config"];
  registry: import("@graviola/edb-detail-renderer-core").DetailRendererRegistryEntry[];
  renderTargetAdornment?: RelationViaAdornments["renderTargetAdornment"];
  renderOccurrenceAdornment?: RelationViaAdornments["renderOccurrenceAdornment"];
}) {
  const targetAs: ViewSize = options.targetAs ?? "listItem";
  const placement = options.qualifierPlacement ?? "trailing";
  const targetSchema = readTargetSchema(itemSchema, options.target, rootSchema);

  const targetPreview = useMemo(() => {
    if (!group.target) return null;
    const typeIRI =
      typeof group.target["@type"] === "string"
        ? group.target["@type"]
        : undefined;
    const typeName =
      (typeIRI && childCtx.typeIRIToTypeName?.(typeIRI)) ?? undefined;
    return extractEntityPreview({
      data: group.target,
      typeName,
      primaryFields: config.primaryFields,
    });
  }, [group.target, childCtx.typeIRIToTypeName, config.primaryFields]);

  const targetView =
    group.target != null ? (
      <ContainedEntityView
        data={group.target}
        schema={targetSchema}
        containedAs={targetAs}
        ctx={{
          ...childCtx,
          preview: targetPreview ?? childCtx.preview,
          headerPreview: targetPreview
            ? {
                label: targetPreview.label ?? null,
                description: targetPreview.description ?? null,
                image: targetPreview.image ?? null,
              }
            : childCtx.headerPreview,
        }}
      />
    ) : (
      <Typography variant="body2" color="text.secondary">
        (missing target)
      </Typography>
    );

  const occurrenceLines = group.occurrences.map((occ) => {
    const qualifiers = (
      <OccurrenceQualifiers
        occ={occ}
        itemSchema={itemSchema}
        virtualRoot={virtualRoot}
        childCtx={childCtx}
        options={options}
        registry={registry}
      />
    );
    const adornment = renderOccurrenceAdornment?.(occ, group);

    if (placement === "below") {
      return (
        <Stack
          key={occ.index}
          direction="row"
          alignItems="flex-start"
          gap={0.5}
        >
          <Box sx={{ flex: 1, minWidth: 0, pl: 4 }}>{qualifiers}</Box>
          {adornment}
        </Stack>
      );
    }

    return (
      <Stack
        key={occ.index}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        gap={0.5}
      >
        <Box sx={{ textAlign: "right" }}>{qualifiers}</Box>
        {adornment}
      </Stack>
    );
  });

  const targetAdornment = renderTargetAdornment?.(group);

  if (placement === "below") {
    return (
      <Stack gap={0.5}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>{targetView}</Box>
          {targetAdornment}
        </Stack>
        <Stack gap={0.25}>{occurrenceLines}</Stack>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="flex-start" gap={1}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>{targetView}</Box>
        {targetAdornment}
      </Stack>
      <Stack gap={0.25} sx={{ flexShrink: 0, minWidth: "8rem" }}>
        {occurrenceLines}
      </Stack>
    </Stack>
  );
}

/** Renders an array of reification nodes projected onto their target entities. */
export function RelationViaRenderer({
  label,
  schema,
  data,
  uiSchema,
  ctx,
  rootSchema,
  renderSetAdornment,
  renderTargetAdornment,
  renderOccurrenceAdornment,
}: RelationViaRendererProps) {
  const { config, registry } = useDetailRendererContext();
  const options = readRelationViaOptions(uiSchema);
  const nesting = readNestingOptions(uiSchema, ctx);

  const arr = schema as JSONSchema7;
  const rawItems = arr.items;
  if (!options || !rawItems || typeof rawItems === "boolean") return null;

  const itemSchema = resolvePropertySchema(rawItems as JSONSchema7, rootSchema);
  const virtualRoot = itemVirtualRoot(itemSchema, rootSchema);
  const groups = groupRelationVia(data, options);

  if (groups.length === 0) return null;

  const childCtx: DetailTesterContext = {
    ...ctx,
    rootSchema,
    depth: ctx.depth + 1,
  };

  const showDividers = options.dividers !== false;
  const setAdornment = renderSetAdornment?.();

  const body = (
    <Stack gap={showDividers ? 1 : 0.5} sx={{ width: "100%" }}>
      {groups.map((group, index) => (
        <Fragment key={group.key}>
          {index > 0 && showDividers ? <Divider /> : null}
          <RelationGroupRow
            group={group}
            itemSchema={itemSchema}
            virtualRoot={virtualRoot}
            rootSchema={rootSchema}
            childCtx={childCtx}
            options={options}
            config={config}
            registry={registry}
            renderTargetAdornment={renderTargetAdornment}
            renderOccurrenceAdornment={renderOccurrenceAdornment}
          />
        </Fragment>
      ))}
    </Stack>
  );

  if (nesting.collapsible) {
    return (
      <NestedSection
        label={label}
        defaultExpanded={nesting.defaultExpanded ?? true}
        flat={nesting.flat}
        adornment={setAdornment}
      >
        {body}
      </NestedSection>
    );
  }

  return (
    <PropertyRow label={label}>
      <Stack gap={0.5} sx={{ width: "100%" }}>
        {setAdornment ? (
          <Stack direction="row" alignItems="center" gap={0.5}>
            {setAdornment}
          </Stack>
        ) : null}
        {body}
      </Stack>
    </PropertyRow>
  );
}
