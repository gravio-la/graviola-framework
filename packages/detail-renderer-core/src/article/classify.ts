import type {
  ControlElement,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";
import { isControl } from "@jsonforms/core";
import { resolveSchema } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

import {
  DETAIL_RELATION_VIA_OPTIONS_KEY,
  type DetailArticleOptions,
} from "../types";
import { resolvePropertySchema } from "../traverse/dispatch";
import {
  isAnyOfObjectUnion,
  isArrayOfInlineObjects,
  isArrayOfNamedEntitys,
  isEntityLikeObjectSchema,
  isInlineObject,
  isOneOfObjectUnion,
} from "../testers/structural";

export type ArticlePropertyClass = "literal" | "object";

const DEFAULT_SECTION_THRESHOLD = 2;

function hasRelationVia(control: ControlElement): boolean {
  const opts = control.options as Record<string, unknown> | undefined;
  return (
    opts?.[DETAIL_RELATION_VIA_OPTIONS_KEY] != null &&
    typeof opts[DETAIL_RELATION_VIA_OPTIONS_KEY] === "object"
  );
}

function schemaDeclaresObjectType(schema: JSONSchema7 | undefined): boolean {
  const t = schema?.type;
  return (
    t === "object" || (Array.isArray(t) && (t as string[]).includes("object"))
  );
}

const emptyTesterCtx = {} as never;

function isObjectShapedSchema(schema: JSONSchema7): boolean {
  return (
    isEntityLikeObjectSchema(schema) ||
    isInlineObject(null as never, schema as never, emptyTesterCtx) ||
    isArrayOfNamedEntitys(null as never, schema as never, emptyTesterCtx) ||
    isArrayOfInlineObjects(null as never, schema as never, emptyTesterCtx) ||
    isAnyOfObjectUnion(null as never, schema as never, emptyTesterCtx) ||
    isOneOfObjectUnion(null as never, schema as never, emptyTesterCtx)
  );
}

function countLiteralAndObjectChildren(schema: JSONSchema7): {
  literals: number;
  objects: number;
} {
  const props = schema.properties as Record<string, JSONSchema7> | undefined;
  if (!props) return { literals: 0, objects: 0 };
  let literals = 0;
  let objects = 0;
  for (const [key, child] of Object.entries(props)) {
    if (key.startsWith("@")) continue;
    if (isObjectShapedSchema(child) || schemaDeclaresObjectType(child)) {
      objects += 1;
    } else {
      literals += 1;
    }
  }
  return { literals, objects };
}

/**
 * Whether an object-shaped property is "section-worthy" under the article
 * threshold (has nested objects, or more than `sectionThreshold` literals).
 */
export function isSectionWorthyObjectSchema(
  schema: JSONSchema7,
  sectionThreshold: number = DEFAULT_SECTION_THRESHOLD,
): boolean {
  const { literals, objects } = countLiteralAndObjectChildren(schema);
  if (objects > 0) return true;
  return literals > sectionThreshold;
}

/**
 * Classify an already-resolved property schema as literal (info box) or
 * object (headed section). `hasRelationViaOption` forces object when the
 * control carries `options.relationVia`.
 */
export function classifyResolvedSchema(
  resolved: JSONSchema7,
  hasRelationViaOption: boolean,
  opts?: DetailArticleOptions,
): ArticlePropertyClass {
  if (hasRelationViaOption) return "object";

  const threshold = opts?.sectionThreshold ?? DEFAULT_SECTION_THRESHOLD;

  // Arrays of entities / inline objects are always headed sections.
  if (
    isArrayOfNamedEntitys(null as never, resolved as never, emptyTesterCtx) ||
    isArrayOfInlineObjects(null as never, resolved as never, emptyTesterCtx)
  ) {
    return "object";
  }

  // Named entities are always sections — stubs used at the root schema often
  // only declare @id/@type/label and would fail the inline sectionThreshold.
  if (isEntityLikeObjectSchema(resolved)) {
    return "object";
  }

  // Small anonymous objects stay in the info box; larger ones become sections.
  if (isInlineObject(null as never, resolved as never, emptyTesterCtx)) {
    return isSectionWorthyObjectSchema(resolved, threshold)
      ? "object"
      : "literal";
  }

  if (
    isAnyOfObjectUnion(null as never, resolved as never, emptyTesterCtx) ||
    isOneOfObjectUnion(null as never, resolved as never, emptyTesterCtx)
  ) {
    return "object";
  }

  return "literal";
}

/**
 * Classify a property Control as literal (info box) or object (headed section).
 * Resolves `control.scope` against `rootSchema`, then delegates to
 * {@link classifyResolvedSchema}.
 */
export function classifyPropertyControl(
  control: ControlElement,
  rootSchema: JSONSchema7,
  opts?: DetailArticleOptions,
): ArticlePropertyClass {
  if (hasRelationVia(control)) return "object";

  const scope = control.scope;
  if (!scope) return "literal";

  const atScope = resolveSchema(rootSchema, scope, rootSchema) as
    | JSONSchema7
    | undefined;
  if (!atScope) return "literal";

  const resolved = resolvePropertySchema(atScope, rootSchema);
  return classifyResolvedSchema(resolved, false, opts);
}

export type PartitionedArticleElements = {
  labels: UISchemaElement[];
  literals: ControlElement[];
  objects: UISchemaElement[];
};

/**
 * Partition layout children into labels, literal Controls (info box), and
 * object Controls / other elements (headed sections). Preserves declaration
 * order within each bucket.
 */
export function partitionArticleElements(
  elements: UISchemaElement[],
  rootSchema: JSONSchema7 | JsonSchema,
  opts?: DetailArticleOptions,
): PartitionedArticleElements {
  const labels: UISchemaElement[] = [];
  const literals: ControlElement[] = [];
  const objects: UISchemaElement[] = [];
  const root = rootSchema as JSONSchema7;

  for (const el of elements) {
    if (!el) continue;
    const elType = (el as { type?: string }).type;
    if (elType === "Label") {
      labels.push(el);
      continue;
    }
    if (isControl(el)) {
      const cls = classifyPropertyControl(el as ControlElement, root, opts);
      if (cls === "literal") {
        literals.push(el as ControlElement);
      } else {
        objects.push(el);
      }
      continue;
    }
    // Nested layouts / unknown nodes pass through as object (section) content.
    objects.push(el);
  }

  return { labels, literals, objects };
}
