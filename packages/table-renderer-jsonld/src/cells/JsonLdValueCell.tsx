import React, { useMemo } from "react";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type {
  MRT_Cell,
  MRT_Row,
  MRT_TableInstance,
} from "material-react-table";
import {
  pickValueRenderer,
  readValueRendererOptions,
  VALUE_RENDERER_OPTION,
  VALUE_RENDERER_OPTIONS_KEY,
  type DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";

import { useJsonLdTableContext } from "../JsonLdTableContext";
import { readJsonLdCellMeta } from "./types";

type CellProps = {
  cell: MRT_Cell<Record<string, unknown>>;
  row: MRT_Row<Record<string, unknown>>;
  table: MRT_TableInstance<Record<string, unknown>>;
};

export function JsonLdValueCell({ cell }: CellProps) {
  const meta = readJsonLdCellMeta(cell.column.columnDef.meta);
  const { valueRenderers, locale } = useJsonLdTableContext();

  const { Renderer, rendererOptions, propSchema, rootSchema } = useMemo(() => {
    if (!meta)
      return {
        Renderer: null,
        rendererOptions: undefined,
        propSchema: null,
        rootSchema: null,
      };

    const columnOptions = meta.jsonLdColumnOptions ?? {};
    const explicitRenderer =
      typeof columnOptions[VALUE_RENDERER_OPTION] === "string"
        ? (columnOptions[VALUE_RENDERER_OPTION] as string)
        : undefined;
    const explicitOptions =
      columnOptions[VALUE_RENDERER_OPTIONS_KEY] &&
      typeof columnOptions[VALUE_RENDERER_OPTIONS_KEY] === "object"
        ? (columnOptions[VALUE_RENDERER_OPTIONS_KEY] as Record<string, unknown>)
        : undefined;

    const control: ControlElement = {
      type: "Control",
      scope: meta.jsonLdScope,
      options: {
        ...(explicitRenderer
          ? { [VALUE_RENDERER_OPTION]: explicitRenderer }
          : {}),
        [VALUE_RENDERER_OPTIONS_KEY]: {
          ...(explicitOptions ?? {}),
          ...(locale ? { locale } : {}),
        },
      },
    };

    const ctx: DetailTesterContext = {
      rootSchema: meta.jsonLdRootSchema,
      depth: 0,
      maxDepth: 1,
    };

    const entry = pickValueRenderer(
      valueRenderers,
      control,
      meta.jsonLdPropSchema as JSONSchema7,
      ctx,
    );

    return {
      Renderer: entry?.renderer ?? null,
      rendererOptions: readValueRendererOptions(control),
      propSchema: meta.jsonLdPropSchema,
      rootSchema: meta.jsonLdRootSchema,
    };
  }, [meta, valueRenderers, locale]);

  const value = cell.getValue();
  if (!Renderer || !propSchema || !rootSchema) {
    if (value == null || value === "") return null;
    return <span>{String(value)}</span>;
  }

  const ctx: DetailTesterContext = {
    rootSchema,
    depth: 0,
    maxDepth: 1,
  };

  return (
    <Renderer
      value={value}
      schema={propSchema}
      options={rendererOptions}
      ctx={ctx}
    />
  );
}
