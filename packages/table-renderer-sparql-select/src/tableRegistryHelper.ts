import { FieldExtractDeclaration } from "@graviola/edb-core-types";
import { isPrimitive } from "@graviola/json-schema-utils";
import { isControl, Tester } from "@jsonforms/core";
import { TFunction } from "i18next";
import type { JSONSchema7, JSONSchema7Definition } from "json-schema";
import get from "lodash-es/get";
import type { MRT_ColumnDef } from "material-react-table";

export const pathToString = (path: string[]) => path.join("_");

type PathKeyMap = {
  [key: string]: {
    path: string;
    defaultValue?: any;
  };
};
export const mkAccessor =
  (path: string, defaultValue?: string | any, fn?: (v: any) => any) =>
  (row: any) => {
    const raw = get(row, path, defaultValue || "");
    return fn ? fn(raw) : raw;
  };
export const urlSuffix = (uri: string) => {
  return uri.substring(
    (uri.includes("#") ? uri.lastIndexOf("#") : uri.lastIndexOf("/")) + 1,
    uri.length,
  );
};
export const mkMultiAccessor = (pathKeysMap: PathKeyMap) => (row: any) => {
  return Object.fromEntries(
    Object.entries(pathKeysMap).map(([key, { path, defaultValue }]) => [
      key,
      get(row, path, defaultValue || ""),
    ]),
  );
};
export const extractSingleFieldIfString = (
  entry: any | null,
  fieldExtractDeclaration: FieldExtractDeclaration,
): string | null => {
  try {
    if (typeof fieldExtractDeclaration !== "string") {
      return null;
    }
    const value = entry[`${fieldExtractDeclaration}_single`]?.value;
    if (typeof value !== "string") {
      return null;
    } else {
      return value;
    }
  } catch (e) {
    return null;
  }
};

export const singleValueColumnStub: (
  path: string[],
  key: string,
  t: TFunction,
  label?: string,
) => Pick<MRT_ColumnDef<any>, "header" | "id" | "accessorFn"> = (
  path,
  key,
  t,
  label,
) => ({
  header: label || t(pathToString([...path, key])),
  id: pathToString([...path, key, "single"]),
  accessorFn: mkAccessor(`${pathToString([...path, key, "single"])}.value`, ""),
});
export const isPrimitiveControl: Tester = (_, schema) =>
  typeof schema.type === "string" && isPrimitive(schema.type);
export const isObjectWithRefControl: Tester = (uischema, schema) =>
  schema.$ref && isControl(uischema);
export const titleOf = (schema: JSONSchema7Definition) =>
  (schema as JSONSchema7)?.title;
