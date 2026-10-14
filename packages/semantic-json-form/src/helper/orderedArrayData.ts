import type { OrderBySpec } from "@graviola/edb-core-types";
import {
  applyUserOrderedFormChange,
  orderSpecsFromUiSchema,
  sortDataByOrderSpecs,
} from "@graviola/edb-core-utils";
import {
  bringDefinitionToTop,
  definitionNameFromRef,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

type UiSchemaRoot = Parameters<typeof orderSpecsFromUiSchema>[0];

export function integerFieldsForOrderSpecs(
  schema: JSONSchema7 | undefined,
  specs: Record<string, OrderBySpec>,
): Set<string> {
  const fields = new Set<string>();
  if (!schema?.properties) {
    return fields;
  }

  for (const [slot, spec] of Object.entries(specs)) {
    const { field } = spec;
    const prop = schema.properties[slot] as JSONSchema7 | undefined;
    const items = prop?.items;
    if (!items || typeof items !== "object" || Array.isArray(items)) {
      continue;
    }
    let itemSchema: JSONSchema7 | undefined;
    if (items.$ref) {
      const defName = definitionNameFromRef(items.$ref);
      if (defName) {
        itemSchema = bringDefinitionToTop(schema, defName) as JSONSchema7;
      }
    } else {
      itemSchema = items as JSONSchema7;
    }
    const fieldSchema = itemSchema?.properties?.[field] as
      | JSONSchema7
      | undefined;
    const types = fieldSchema?.type;
    const isInteger =
      types === "integer" ||
      (Array.isArray(types) && types.includes("integer"));
    if (isInteger) {
      fields.add(field);
    }
  }

  return fields;
}

export function orderSpecsForType(
  uischemata: Record<string, unknown> | undefined,
  typeName: string,
): Record<string, OrderBySpec> {
  return orderSpecsFromUiSchema(
    uischemata?.[typeName] as UiSchemaRoot | undefined,
  );
}

export function sortLoadedFormData<T extends Record<string, unknown>>(
  data: T,
  specs: Record<string, OrderBySpec>,
): T {
  return sortDataByOrderSpecs(data, specs);
}

export function applyUserFormDataOrder<T extends Record<string, unknown>>(
  prev: T,
  next: T,
  specs: Record<string, OrderBySpec>,
  integerFields: Set<string>,
): T {
  return applyUserOrderedFormChange(prev, next, specs, integerFields);
}
