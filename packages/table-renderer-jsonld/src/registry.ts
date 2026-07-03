import type {
  TableColumnRegistry,
  TableColumnRegistryEntry,
} from "@graviola/edb-table-types";
import get from "lodash-es/get";
import type { JSONSchema7 } from "json-schema";

import { JsonLdEntityChipArrayCell } from "./cells/JsonLdEntityChipArrayCell";
import { JsonLdEntityChipCell } from "./cells/JsonLdEntityChipCell";
import {
  JSONLD_PRIMARY_IMAGE_KEY,
  JSONLD_PRIMARY_TYPE_NAME,
  JsonLdPrimaryColumnCell,
} from "./cells/JsonLdPrimaryColumnCell";
import { JsonLdValueCell } from "./cells/JsonLdValueCell";
import { scopeToPropertyKey } from "./scope";

export const mkJsonLdAccessor = (scope: string) => {
  const path = scope
    .replace(/^#\//, "")
    .split("properties/")
    .join("")
    .split("/")
    .join(".");
  return (row: Record<string, unknown>) => get(row, path);
};

const isString = (schema: JSONSchema7) => schema.type === "string";
const isBoolean = (schema: JSONSchema7) => schema.type === "boolean";
const isNumber = (schema: JSONSchema7) =>
  schema.type === "number" || schema.type === "integer";
const isArray = (schema: JSONSchema7) => schema.type === "array";
const isObjectArray = (schema: JSONSchema7) => {
  if (schema.type !== "array") return false;
  const items = schema.items;
  if (!items || Array.isArray(items)) return false;
  const itemSchema = items as JSONSchema7;
  return itemSchema.type === "object" || !!itemSchema.$ref;
};
const isDateLike = (schema: JSONSchema7) =>
  schema.type === "string" &&
  (schema.format === "date" || schema.format === "date-time");
const isEnumLike = (schema: JSONSchema7) =>
  Array.isArray(schema.enum) || Array.isArray(schema.oneOf);
const isObject = (schema: JSONSchema7) =>
  schema.type === "object" || !!schema.$ref;

const columnLabel = (
  scope: string,
  column: { label?: string } | undefined,
  ctx: { t?: (key: string) => string },
) => {
  if (column?.label) return column.label;
  const key = scopeToPropertyKey(scope);
  return key && ctx.t ? ctx.t(key) : (key ?? scope);
};

/**
 * Primary label column: matches the property declared as `primaryFields[typeName].label`.
 * Renders avatar (primary image key) + label, clickable to open the detail view —
 * parity with the sparql-select row shape's PrimaryColumnContent.
 */
const primaryEntry: TableColumnRegistryEntry = {
  name: "jsonld:primary",
  tester: (_schema, scope, _uiColumn, ctx) => {
    const labelKey = ctx.primaryField?.label;
    if (!labelKey) return -1;
    return scopeToPropertyKey(scope) === labelKey ? 10 : -1;
  },
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    Cell: JsonLdPrimaryColumnCell,
    meta: {
      ...(ctx.primaryField?.image
        ? { [JSONLD_PRIMARY_IMAGE_KEY]: ctx.primaryField.image }
        : {}),
      [JSONLD_PRIMARY_TYPE_NAME]: ctx.typeName,
    },
  }),
};

const primitiveEntry: TableColumnRegistryEntry = {
  name: "jsonld:primitive",
  tester: (schema) => (isString(schema) || isNumber(schema) ? 3 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    Cell: JsonLdValueCell,
  }),
};

const dateEntry: TableColumnRegistryEntry = {
  name: "jsonld:date",
  tester: (schema) => (isDateLike(schema) ? 4 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    Cell: JsonLdValueCell,
  }),
};

const booleanEntry: TableColumnRegistryEntry = {
  name: "jsonld:boolean",
  tester: (schema) => (isBoolean(schema) ? 4 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    Cell: JsonLdValueCell,
  }),
};

const enumEntry: TableColumnRegistryEntry = {
  name: "jsonld:enum",
  tester: (schema) => (isEnumLike(schema) ? 4 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    Cell: JsonLdValueCell,
  }),
};

const objectEntry: TableColumnRegistryEntry = {
  name: "jsonld:nested-chip",
  tester: (schema) => (isObject(schema) ? 2 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    maxSize: 400,
    Cell: JsonLdEntityChipCell,
  }),
};

const objectArrayEntry: TableColumnRegistryEntry = {
  name: "jsonld:nested-chip-array",
  tester: (schema) => (isObjectArray(schema) ? 3 : isArray(schema) ? 1 : -1),
  renderer: ({ scope, column, ctx }) => ({
    id: scope,
    header: columnLabel(scope, column, ctx),
    accessorFn: mkJsonLdAccessor(scope),
    maxSize: 500,
    Cell: JsonLdEntityChipArrayCell,
  }),
};

const fallbackEntry: TableColumnRegistryEntry = {
  name: "jsonld:fallback-omit",
  tester: () => 0,
  renderer: () => ({}),
};

export const jsonLdColumnRegistry: TableColumnRegistry = [
  primaryEntry,
  dateEntry,
  enumEntry,
  booleanEntry,
  objectArrayEntry,
  objectEntry,
  primitiveEntry,
  fallbackEntry,
];

export const jsonldPrimaryEntry = primaryEntry;
export const jsonldPrimitiveEntry = primitiveEntry;
export const jsonldDateEntry = dateEntry;
export const jsonldBooleanEntry = booleanEntry;
export const jsonldEnumEntry = enumEntry;
export const jsonldIdRefEntry = objectEntry;
export const jsonldNestedObjectChipEntry = objectEntry;
export const jsonldNestedArrayChipsEntry = objectArrayEntry;
export const jsonldArrayPrimitiveEntry = objectArrayEntry;
export const jsonldFallbackOmitEntry = fallbackEntry;
