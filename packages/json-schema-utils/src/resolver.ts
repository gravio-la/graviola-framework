import { JSONSchema4, JSONSchema7 } from "json-schema";
import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";

import { decode } from "./jsonPointer";

export type JsonSchema = JSONSchema7 | JSONSchema4;

type ResolveContext = {
  rootSchema: JsonSchema;
  /** (schema object → scope paths) currently being resolved; guards against $ref cycles. */
  inProgress: Map<JsonSchema, Set<string>>;
};

const invalidSegment = (pathSegment: string) =>
  pathSegment === "#" || pathSegment === undefined || pathSegment === "";

/**
 * Resolve the given schema path in order to obtain a subschema.
 *
 * Algorithm derived from `@jsonforms/core` (MIT). Cycle guard follows JSON Forms 3.7.
 *
 * @param {JsonSchema} schema_ the root schema from which to start
 * @param {string} schemaPath the schema path to be resolved
 * @param {JsonSchema} rootSchema the actual root schema
 * @returns {JsonSchema} the resolved sub-schema
 */
export const resolveSchema = (
  schema: JsonSchema,
  schemaPath: string | undefined,
  rootSchema: JsonSchema,
): JsonSchema | undefined => {
  const ctx: ResolveContext = {
    rootSchema,
    inProgress: new Map(),
  };
  return resolveWithContext(schema, schemaPath, ctx);
};

const resolveWithContext = (
  schema: JsonSchema,
  schemaPath: string | undefined,
  ctx: ResolveContext,
): JsonSchema | undefined => {
  let paths = ctx.inProgress.get(schema);
  if (!paths) {
    paths = new Set();
    ctx.inProgress.set(schema, paths);
  }

  const pathKey = schemaPath ?? "";
  if (paths.has(pathKey)) {
    return undefined;
  }

  paths.add(pathKey);
  try {
    const segments = schemaPath?.split("/").map(decode) ?? [];
    return resolveSchemaWithSegments(schema, segments, ctx);
  } finally {
    paths.delete(pathKey);
  }
};

const resolveSchemaWithSegments = (
  schema_: JsonSchema,
  pathSegments: string[],
  ctx: ResolveContext,
): JsonSchema | undefined => {
  if (isEmpty(schema_)) {
    return undefined;
  }

  let schema: JsonSchema | undefined = schema_;

  if (schema.$ref) {
    schema = resolveWithContext(ctx.rootSchema, schema.$ref, ctx);
  }

  if (!pathSegments || pathSegments.length === 0) {
    return schema;
  }

  const [segment, ...remainingSegments] = pathSegments;

  if (invalidSegment(segment) && schema) {
    return resolveSchemaWithSegments(schema, remainingSegments, ctx);
  }

  const singleSegmentResolveSchema = get(schema, segment);

  const resolvedSchema = resolveSchemaWithSegments(
    singleSegmentResolveSchema,
    remainingSegments,
    ctx,
  );
  if (resolvedSchema) {
    return resolvedSchema;
  }

  if (segment === "properties" || segment === "items") {
    // Let's try to resolve the path, assuming oneOf/allOf/anyOf/then/else was omitted.
    // We only do this when traversing an object or array as we want to avoid
    // following a property which is named oneOf, allOf, anyOf, then or else.
    let alternativeResolveResult: JsonSchema | undefined;

    if (!schema) return undefined;

    const schema7 = schema as JSONSchema7;
    const subSchemas = [
      ...(schema.oneOf ?? []),
      ...(schema.allOf ?? []),
      ...(schema.anyOf ?? []),
      ...(schema7.then ? [schema7.then as JsonSchema] : []),
      ...(schema7.else ? [schema7.else as JsonSchema] : []),
    ] as JsonSchema[];

    for (const subSchema of subSchemas) {
      alternativeResolveResult = resolveSchemaWithSegments(
        subSchema,
        [segment, ...remainingSegments],
        ctx,
      );
      if (alternativeResolveResult) {
        break;
      }
    }
    return alternativeResolveResult;
  }

  return undefined;
};
