import type { JSONSchema7 } from "json-schema";
import type { MRT_ColumnDef } from "material-react-table";
import { resolveSchema, isJSONSchema } from "@graviola/json-schema-utils";
import { adaptColumnFragmentToMrt } from "@graviola/edb-table-mrt-adapter";
import {
  selectTableRenderer,
  type TableColumnRegistry,
  type TableTesterContext,
  type TableUiSchema,
  type TableUiSchemaColumn,
} from "@graviola/edb-table-types";

import { jsonLdColumnRegistry } from "./registry";
import { scopeToPropertyKey } from "./scope";

const DEFAULT_HIDDEN = new Set(["@id", "@type"]);

export type ComposeJsonLdColumnsOptions = {
  typeName: string;
  tableUiSchema?: TableUiSchema;
  t?: (key: string, options?: Record<string, unknown>) => string;
  locale?: string;
  columnRegistry?: TableColumnRegistry;
  skipProperties?: string[];
};

function resolvePropertySchema(
  rootSchema: JSONSchema7,
  key: string,
): JSONSchema7 | null {
  const raw = rootSchema.properties?.[key];
  if (!raw || !isJSONSchema(raw)) return null;
  const propSchema = raw as JSONSchema7;
  if (!propSchema.$ref) return propSchema;
  const resolved = resolveSchema(propSchema, propSchema.$ref, rootSchema);
  if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) {
    return null;
  }
  return resolved as JSONSchema7;
}

function findUiColumn(
  tableUiSchema: TableUiSchema | undefined,
  scope: string,
): TableUiSchemaColumn | undefined {
  return tableUiSchema?.columns?.find((col) => col.scope === scope);
}

function propertyKeys(
  schema: JSONSchema7,
  tableUiSchema: TableUiSchema | undefined,
  skip: Set<string>,
): string[] {
  if (tableUiSchema?.mode === "whitelist" && tableUiSchema.columns.length > 0) {
    return tableUiSchema.columns
      .map((col) => scopeToPropertyKey(col.scope))
      .filter((key) => key && !skip.has(key)) as string[];
  }

  const ordered = tableUiSchema?.columns
    ?.map((col) => scopeToPropertyKey(col.scope))
    .filter(Boolean) as string[] | undefined;

  const fromSchema = Object.keys(schema.properties ?? {}).filter(
    (key) => !skip.has(key),
  );

  if (!ordered?.length) return fromSchema;

  const rank = new Map(ordered.map((key, index) => [key, index]));
  return [...fromSchema].sort((a, b) => {
    const ra = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}

/**
 * Build MRT column definitions from a JSON-LD entity schema via structural dispatch.
 */
export function composeJsonLdColumns(
  schema: JSONSchema7,
  options: ComposeJsonLdColumnsOptions,
): MRT_ColumnDef<Record<string, unknown>>[] {
  const registry = options.columnRegistry ?? jsonLdColumnRegistry;
  const skip = new Set([...DEFAULT_HIDDEN, ...(options.skipProperties ?? [])]);
  const keys = propertyKeys(schema, options.tableUiSchema, skip);

  return keys
    .map((key) => {
      const scope = `#/properties/${key}`;
      const propSchema = resolvePropertySchema(schema, key);
      if (!propSchema) return null;

      const uiColumn = findUiColumn(options.tableUiSchema, scope);
      const ctx: TableTesterContext = {
        rootSchema: schema,
        typeName: options.typeName,
        rowShape: "jsonld",
        t: options.t,
        rendererHint: uiColumn?.rendererHint,
        uiSchemaOptions: uiColumn?.options,
      };

      const entry = selectTableRenderer(
        registry,
        propSchema,
        scope,
        uiColumn,
        ctx,
      );
      if (!entry) return null;

      const fragment = entry.renderer({
        schema: propSchema,
        scope,
        column: uiColumn ?? {
          scope,
          label: options.t?.(key) ?? key,
          options: uiColumn?.options,
        },
        ctx,
      });

      if (!fragment.id && !fragment.accessorKey && !fragment.accessorFn) {
        return null;
      }

      const header =
        fragment.header ?? uiColumn?.label ?? options.t?.(key) ?? key;

      return adaptColumnFragmentToMrt({
        ...fragment,
        id: fragment.id ?? scope,
        header,
        meta: {
          ...(fragment.meta ?? {}),
          jsonLdScope: scope,
          jsonLdPropSchema: propSchema,
          jsonLdRootSchema: schema,
          jsonLdColumnOptions: uiColumn?.options,
        },
      }) as MRT_ColumnDef<Record<string, unknown>>;
    })
    .filter(
      (col): col is MRT_ColumnDef<Record<string, unknown>> => col != null,
    );
}
