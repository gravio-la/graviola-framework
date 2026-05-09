import type {
  TableColumnRegistry,
  TableColumnRegistryEntry,
} from "@graviola/edb-table-types";
import get from "lodash-es/get";
import type { JSONSchema7 } from "json-schema";

export const mkJsonLdAccessor = (scope: string) => {
  const path = scope
    .replace(/^#\//, "")
    .split("properties/")
    .join("")
    .split("/")
    .join(".");
  return (row: any) => get(row, path);
};

const isString = (schema: JSONSchema7) => schema.type === "string";
const isBoolean = (schema: JSONSchema7) => schema.type === "boolean";
const isNumber = (schema: JSONSchema7) =>
  schema.type === "number" || schema.type === "integer";
const isArray = (schema: JSONSchema7) => schema.type === "array";
const isDateLike = (schema: JSONSchema7) =>
  schema.type === "string" &&
  (schema.format === "date" || schema.format === "date-time");
const isEnumLike = (schema: JSONSchema7) =>
  Array.isArray(schema.enum) || Array.isArray(schema.oneOf);
const isObject = (schema: JSONSchema7) =>
  schema.type === "object" || !!schema.$ref;

const primitiveEntry: TableColumnRegistryEntry = {
  name: "jsonld:primitive",
  tester: (schema) => (isString(schema) || isNumber(schema) ? 3 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
  }),
};

const dateEntry: TableColumnRegistryEntry = {
  name: "jsonld:date",
  tester: (schema) => (isDateLike(schema) ? 4 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: (row: any) => {
      const value = mkJsonLdAccessor(scope)(row);
      if (!value) return "";
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    },
  }),
};

const booleanEntry: TableColumnRegistryEntry = {
  name: "jsonld:boolean",
  tester: (schema) => (isBoolean(schema) ? 4 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
  }),
};

const enumEntry: TableColumnRegistryEntry = {
  name: "jsonld:enum",
  tester: (schema) => (isEnumLike(schema) ? 4 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
  }),
};

const objectEntry: TableColumnRegistryEntry = {
  name: "jsonld:nested-chip",
  tester: (schema) => (isObject(schema) ? 2 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
  }),
};

const objectArrayEntry: TableColumnRegistryEntry = {
  name: "jsonld:nested-chip-array",
  tester: (schema) => (isArray(schema) ? 2 : -1),
  renderer: ({ scope, column }) => ({
    id: scope,
    header: column?.label,
    accessorFn: mkJsonLdAccessor(scope),
  }),
};

const fallbackEntry: TableColumnRegistryEntry = {
  name: "jsonld:fallback-omit",
  tester: () => 0,
  renderer: () => ({}),
};

export const jsonLdColumnRegistry: TableColumnRegistry = [
  dateEntry,
  enumEntry,
  booleanEntry,
  primitiveEntry,
  objectArrayEntry,
  objectEntry,
  fallbackEntry,
];

export const jsonldPrimitiveEntry = primitiveEntry;
export const jsonldDateEntry = dateEntry;
export const jsonldBooleanEntry = booleanEntry;
export const jsonldEnumEntry = enumEntry;
export const jsonldIdRefEntry = objectEntry;
export const jsonldNestedObjectChipEntry = objectEntry;
export const jsonldNestedArrayChipsEntry = objectArrayEntry;
export const jsonldArrayPrimitiveEntry = objectArrayEntry;
export const jsonldFallbackOmitEntry = fallbackEntry;

export const JsonLdChipCell = () => null;
