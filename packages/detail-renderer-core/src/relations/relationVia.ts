import type {
  ControlElement,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core";
import { contentHash8 } from "@graviola/json-schema-utils";
import get from "lodash-es/get";
import orderBy from "lodash-es/orderBy";
import type { JSONSchema7 } from "json-schema";

import {
  DETAIL_RELATION_VIA_OPTIONS_KEY,
  type DetailRelationViaOptions,
} from "../types";

export interface RelationOccurrence {
  /** Index in the source array — stable React key and binding-path anchor. */
  index: number;
  item: Record<string, unknown>;
  /** Present when the intermediate node itself carries an `@id`. */
  occurrenceIRI?: string;
}

export interface RelationGroup {
  key: string;
  target?: Record<string, unknown>;
  targetIRI?: string;
  occurrences: RelationOccurrence[];
}

function readOptionsBundle(
  uiSchema: UISchemaElement,
): DetailRelationViaOptions | undefined {
  const ctrl = uiSchema as ControlElement;
  const bundle = ctrl.options?.[DETAIL_RELATION_VIA_OPTIONS_KEY];
  if (!bundle || typeof bundle !== "object") return undefined;
  const target = (bundle as DetailRelationViaOptions).target;
  if (typeof target !== "string" || target.length === 0) return undefined;
  return bundle as DetailRelationViaOptions;
}

export function readRelationViaOptions(
  uiSchema: UISchemaElement,
): DetailRelationViaOptions | undefined {
  return readOptionsBundle(uiSchema);
}

function targetFromItem(
  item: Record<string, unknown>,
  targetPath: string,
): Record<string, unknown> | undefined {
  const value = get(item, targetPath);
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function targetGroupKey(
  target: Record<string, unknown> | undefined,
  index: number,
): string {
  if (target == null) return `__missing__:${index}`;
  const id = target["@id"];
  if (typeof id === "string" && id.length > 0) return id;
  return contentHash8(target);
}

function sortOccurrences(
  occurrences: RelationOccurrence[],
  options: DetailRelationViaOptions,
): RelationOccurrence[] {
  const sortPath = options.sortOccurrencesBy;
  if (!sortPath) return occurrences;
  const direction = options.sortDirection === "desc" ? "desc" : "asc";
  return orderBy(occurrences, [(occ) => get(occ.item, sortPath)], [direction]);
}

export function resolveQualifierProperties(
  itemSchema: JSONSchema7,
  options: DetailRelationViaOptions,
): string[] {
  if (options.qualifierProperties?.length) {
    return options.qualifierProperties;
  }
  const targetKey = options.target.split(".")[0] ?? options.target;
  const props = itemSchema.properties ?? {};
  return Object.keys(props).filter(
    (key) => !key.startsWith("@") && key !== targetKey,
  );
}

export function groupRelationVia(
  data: unknown,
  options: DetailRelationViaOptions,
): RelationGroup[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const groupByTarget = options.groupByTarget !== false;
  const groups: RelationGroup[] = [];
  const groupIndex = new Map<string, number>();

  data.forEach((raw, index) => {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return;

    const item = raw as Record<string, unknown>;
    const target = targetFromItem(item, options.target);
    const targetIRI =
      typeof target?.["@id"] === "string" ? target["@id"] : undefined;
    const occurrenceIRI =
      typeof item["@id"] === "string" ? item["@id"] : undefined;

    const occurrence: RelationOccurrence = {
      index,
      item,
      occurrenceIRI,
    };

    const key = groupByTarget
      ? targetGroupKey(target, index)
      : `__item__:${index}`;

    const existingIdx = groupIndex.get(key);
    if (existingIdx != null) {
      groups[existingIdx]!.occurrences.push(occurrence);
      return;
    }

    groupIndex.set(key, groups.length);
    groups.push({
      key,
      target,
      targetIRI,
      occurrences: [occurrence],
    });
  });

  return groups.map((group) => ({
    ...group,
    occurrences: sortOccurrences(group.occurrences, options),
  }));
}

function isArrayOfObjectItems(schema: JSONSchema7 | undefined): boolean {
  if (schema?.type !== "array") return false;
  const items = schema.items as JSONSchema7 | undefined;
  if (!items || typeof items === "boolean") return false;
  return items.type === "object";
}

/** Rank 20 when `options.relationVia.target` is set on an array-of-objects control. */
export const relationViaTester: RankedTester = (uiSchema, schema) => {
  const options = readOptionsBundle(uiSchema);
  if (!options) return -1;
  if (!isArrayOfObjectItems(schema as JSONSchema7)) return -1;
  return 20;
};
