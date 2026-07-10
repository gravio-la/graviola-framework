import type { JSONSchema7 } from "json-schema";
import type { MRT_ColumnDef } from "material-react-table";
import {
  isMetaAnnotationScope,
  parsePropertyScopeSegments,
} from "@graviola/meta-schema";
import { resolveSchema, isJSONSchema } from "@graviola/json-schema-utils";
import { adaptColumnFragmentToMrt } from "@graviola/edb-table-mrt-adapter";
import {
  applyTableUiSchemaToColumns,
  filterForbiddenColumns,
  selectTableRenderer,
  type TableColumnRegistry,
  type TableTesterContext,
  type TableUiSchema,
  type TableUiSchemaColumn,
} from "@graviola/edb-table-types";

import { jsonLdColumnRegistry } from "./registry";
import { isNestedScope, scopeToPropertyKey } from "./scope";

const DEFAULT_HIDDEN = new Set(["@id", "@type"]);

export type ComposeJsonLdColumnsOptions = {
  typeName: string;
  tableUiSchema?: TableUiSchema;
  t?: (key: string, options?: Record<string, unknown>) => string;
  locale?: string;
  columnRegistry?: TableColumnRegistry;
  skipProperties?: string[];
  /** Primary field declaration (label/description/image keys) for the type. */
  primaryField?: TableTesterContext["primaryField"];
};

function resolvePropertySchema(
  rootSchema: JSONSchema7,
  key: string,
): JSONSchema7 | null {
  const raw = rootSchema.properties?.[key];
  if (!raw || !isJSONSchema(raw)) return null;
  const propSchema = raw as JSONSchema7;
  if (!propSchema.$ref) return propSchema;
  const resolved = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
  if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) {
    return null;
  }
  return resolved as JSONSchema7;
}

function resolvePropertySchemaAtScope(
  rootSchema: JSONSchema7,
  scope: string,
): JSONSchema7 | null {
  const keys = parsePropertyScopeSegments(scope);
  if (!keys.length) return null;

  let current: JSONSchema7 = rootSchema;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const raw = current.properties?.[key];
    if (!raw || !isJSONSchema(raw)) return null;

    let propSchema = raw as JSONSchema7;
    if (propSchema.$ref) {
      const resolved = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
      if (
        !resolved ||
        typeof resolved !== "object" ||
        Array.isArray(resolved)
      ) {
        return null;
      }
      propSchema = resolved as JSONSchema7;
    }

    if (index === keys.length - 1) {
      return propSchema;
    }

    if (propSchema.type !== "object" && !propSchema.properties) {
      return null;
    }
    current = propSchema;
  }

  return null;
}

function findUiColumn(
  tableUiSchema: TableUiSchema | undefined,
  scope: string,
): TableUiSchemaColumn | undefined {
  return tableUiSchema?.columns?.find((col) => col.scope === scope);
}

function topLevelPropertyKeys(
  schema: JSONSchema7,
  tableUiSchema: TableUiSchema | undefined,
  skip: Set<string>,
): string[] {
  if (tableUiSchema?.mode === "whitelist" && tableUiSchema.columns.length > 0) {
    return tableUiSchema.columns
      .filter(
        (col) =>
          scopeToPropertyKey(col.scope) &&
          !skip.has(scopeToPropertyKey(col.scope)!) &&
          !isNestedScope(col.scope),
      )
      .map((col) => scopeToPropertyKey(col.scope)!);
  }

  const ordered = tableUiSchema?.columns
    ?.filter(
      (col) => scopeToPropertyKey(col.scope) && !isNestedScope(col.scope),
    )
    .map((col) => scopeToPropertyKey(col.scope)!);

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

function nestedAnnotationScopes(
  tableUiSchema: TableUiSchema | undefined,
): string[] {
  if (!tableUiSchema?.columns?.length) return [];
  return tableUiSchema.columns
    .map((col) => col.scope)
    .filter((scope) => isNestedScope(scope) || isMetaAnnotationScope(scope));
}

function buildColumnFromScope(
  schema: JSONSchema7,
  scope: string,
  options: ComposeJsonLdColumnsOptions,
  registry: TableColumnRegistry,
): MRT_ColumnDef<Record<string, unknown>> | null {
  const propSchema = isNestedScope(scope)
    ? resolvePropertySchemaAtScope(schema, scope)
    : resolvePropertySchema(schema, scopeToPropertyKey(scope) ?? "");
  if (!propSchema) return null;

  const uiColumn = findUiColumn(options.tableUiSchema, scope);
  const ctx: TableTesterContext = {
    rootSchema: schema,
    typeName: options.typeName,
    rowShape: "jsonld",
    t: options.t,
    rendererHint: uiColumn?.rendererHint,
    uiSchemaOptions: uiColumn?.options,
    primaryField: options.primaryField,
  };

  const entry = selectTableRenderer(registry, propSchema, scope, uiColumn, ctx);
  if (!entry) return null;

  const fragment = entry.renderer({
    schema: propSchema,
    scope,
    column: uiColumn ?? {
      scope,
      label: options.t?.(scopeToPropertyKey(scope) ?? scope) ?? scope,
    },
    ctx,
  });

  if (!fragment.id && !fragment.accessorKey && !fragment.accessorFn) {
    return null;
  }

  const header =
    fragment.header ??
    uiColumn?.label ??
    options.t?.(scopeToPropertyKey(scope) ?? scope) ??
    scope;

  return adaptColumnFragmentToMrt({
    ...fragment,
    id: fragment.id ?? scope,
    header,
    enableSorting: uiColumn?.sortable === true ? true : false,
    meta: {
      ...(fragment.meta ?? {}),
      jsonLdScope: scope,
      jsonLdPropSchema: propSchema,
      jsonLdRootSchema: schema,
      jsonLdColumnOptions: uiColumn?.options,
    },
  }) as MRT_ColumnDef<Record<string, unknown>>;
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

  const scopes = new Set<string>();
  if (
    options.tableUiSchema?.mode === "whitelist" &&
    options.tableUiSchema.columns.length > 0
  ) {
    for (const col of options.tableUiSchema.columns) {
      scopes.add(col.scope);
    }
  } else {
    for (const key of topLevelPropertyKeys(
      schema,
      options.tableUiSchema,
      skip,
    )) {
      scopes.add(`#/properties/${key}`);
    }
    for (const scope of nestedAnnotationScopes(options.tableUiSchema)) {
      scopes.add(scope);
    }
  }

  const columns = [...scopes]
    .map((scope) => buildColumnFromScope(schema, scope, options, registry))
    .filter(
      (col): col is MRT_ColumnDef<Record<string, unknown>> => col != null,
    );

  const filtered = filterForbiddenColumns(
    columns,
    options.tableUiSchema,
    "jsonld",
  );

  return applyTableUiSchemaToColumns(filtered, options.tableUiSchema, "jsonld");
}
