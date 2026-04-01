import type { WalkerOptions } from "@graviola/edb-core-types";
import { filterUndefOrNull, isValidUrl } from "@graviola/edb-core-utils";
import {
  isJSONSchema,
  isJSONSchemaDefinition,
  resolveSchema,
} from "@graviola/json-schema-utils";
import ds from "@rdfjs/data-model";
import namespace from "@rdfjs/namespace";
import type { Dataset, DatasetCore } from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import clownface from "clownface";
import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

import type { JsonSchema } from "./types";

const isNil = (val: any) => val === undefined || val === null;

type CircularCounter = {
  [ref: string]: number;
};

const PRIMITIVE_TYPES = new Set(["string", "number", "integer", "boolean"]);

/**
 * JSON Schema allows `type` as a string or an array (e.g. `["string", "null"]` from Zod optional
 * fields). Extraction must treat the first primitive member as the literal type, otherwise
 * `!Array.isArray(schema.type)` blocks reading RDF literals back into JSON.
 */
const normalizePrimitiveType = (schema: JSONSchema7): string | undefined => {
  const t = schema.type;
  if (typeof t === "string" && PRIMITIVE_TYPES.has(t)) return t;
  if (Array.isArray(t)) {
    const prim = (t as string[]).find((x) => PRIMITIVE_TYPES.has(x));
    return prim;
  }
  return undefined;
};

const isPrimitiveSchema = (schema: JSONSchema7): boolean =>
  Boolean(normalizePrimitiveType(schema)) &&
  !schema.properties &&
  !schema.items;

/**
 * Zod / merged schemas often chain $ref (e.g. geo -> __schema17 -> __schema18 -> string).
 * resolveSchema only peels one hop; without this, primitives are mis-classified and extraction drops literals.
 */
const unwrapRefChain = (
  schema: JSONSchema7 | undefined,
  rootSchema: JSONSchema7,
  maxDepth = 32,
): JSONSchema7 | undefined => {
  let s: JsonSchema | undefined = schema;
  for (
    let i = 0;
    i < maxDepth && s && isJSONSchema(s as JSONSchema7Definition);
    i++
  ) {
    const cur = s as JSONSchema7;
    if (isPrimitiveSchema(cur)) return cur;
    if (typeof cur.type === "string" && cur.type !== "object") return cur;
    if (
      cur.type === "object" &&
      cur.properties &&
      Object.keys(cur.properties).length > 0
    )
      return cur;
    if (cur.$ref) {
      const next = resolveSchema(
        rootSchema as JsonSchema,
        cur.$ref,
        rootSchema as JsonSchema,
      );
      if (!next) return cur;
      s = next;
      continue;
    }
    return cur;
  }
  return s as JSONSchema7 | undefined;
};

const extractPrimitiveValue = (
  values: string[],
  type: string | undefined,
): any => {
  if (!values || values.length === 0) return undefined;
  switch (type) {
    case "number":
      const f = parseFloat(values[0]);
      return isNaN(f) ? undefined : f;
    case "integer":
      const i = parseInt(values[0]);
      return isNaN(i) ? undefined : i;
    case "boolean":
      return isNil(values[0]) ? undefined : values[0] === "true";
    case "string":
    default:
      return values[0];
  }
};

/**
 * Expands a prefixed property name using the context
 * e.g., "dc:title" with context {"dc": "http://purl.org/dc/elements/1.1/"}
 * becomes "http://purl.org/dc/elements/1.1/title"
 */
const expandPropertyName = (
  property: string,
  baseIRI: string,
  context?: Record<string, string>,
): string => {
  // If context is given, check if property starts with any known prefix followed by ':'
  if (context && typeof property === "string") {
    for (const prefix of Object.keys(context)) {
      const prefixPattern = prefix + ":";
      if (property.startsWith(prefixPattern)) {
        const localName = property.substring(prefixPattern.length);
        return context[prefix] + localName;
      }
    }
  }
  if (isValidUrl(property)) {
    return property;
  }
  return baseIRI + property;
};

const propertyWalker = (
  baseIRI: string,
  node: clownface.GraphPointer,
  subSchema: JSONSchema7,
  rootSchema: JSONSchema7,
  level: number,
  circularSet: CircularCounter,
  options: Partial<WalkerOptions>,
  skipProps: boolean,
  context?: Record<string, string>,
) => {
  const base = namespace(baseIRI);
  const MAX_RECURSION = options?.maxRecursionEachRef || 5;
  const skipNextProps =
    typeof options?.skipAtLevel === "number"
      ? level >= options?.skipAtLevel
      : false;
  if (
    typeof options?.maxRecursion === "number" &&
    level > options?.maxRecursion
  ) {
    return;
  }

  const isDraft = Boolean(node.out(base["__draft"])?.value);
  let additionalProps = {};
  if (subSchema.type === "object") {
    if (node.term?.termType === "NamedNode") {
      additionalProps = {
        "@id": node.term.value,
      };
      if (!isDraft && options.doNotRecurseNamedNodes && level > 0) {
        return additionalProps;
      }
    }
    if (!isDraft && skipProps) {
      return additionalProps;
    }
    const typeNode = node.out(rdf.type);
    if (typeNode.value) {
      additionalProps = {
        ...additionalProps,
        "@type": typeNode.value,
      };
    }
  }
  const entries = Object.entries(subSchema.properties || {})
    .map(([property, schema]) => {
      let val: any;
      // Expand property name using context if available
      const expandedProperty = expandPropertyName(property, baseIRI, context);
      const newNode = node.out(ds.namedNode(expandedProperty));
      if (isJSONSchema(schema)) {
        if (schema.$ref) {
          const ref = schema.$ref;
          const subSchema = resolveSchema(
            schema as JsonSchema,
            "",
            rootSchema as JsonSchema,
          );
          const resolved = unwrapRefChain(subSchema as JSONSchema7, rootSchema);
          if (
            resolved &&
            isJSONSchemaDefinition(resolved as JSONSchema7Definition) &&
            isJSONSchema(resolved as JSONSchema7)
          ) {
            if (isPrimitiveSchema(resolved)) {
              val = extractPrimitiveValue(
                newNode.values,
                normalizePrimitiveType(resolved),
              );
            } else if (
              resolved.type === "array" &&
              resolved.items &&
              !resolved.properties
            ) {
              val = filterUndefOrNull(
                newNode.map((quad) => {
                  if (
                    isJSONSchemaDefinition(resolved.items) &&
                    isJSONSchema(resolved.items)
                  ) {
                    const itemSchema = resolved.items.$ref
                      ? unwrapRefChain(
                          resolveSchema(
                            resolved.items as JsonSchema,
                            "",
                            rootSchema as JsonSchema,
                          ) as JSONSchema7,
                          rootSchema,
                        )
                      : (resolved.items as JSONSchema7);
                    if (itemSchema && isPrimitiveSchema(itemSchema)) {
                      return extractPrimitiveValue(
                        [quad.value],
                        normalizePrimitiveType(itemSchema),
                      );
                    }
                    if (
                      itemSchema &&
                      isJSONSchemaDefinition(
                        itemSchema as JSONSchema7Definition,
                      ) &&
                      isJSONSchema(itemSchema)
                    ) {
                      const itemRef =
                        resolved.items.$ref || (itemSchema as any).$ref;
                      if (
                        itemRef &&
                        (circularSet[itemRef] || 0) < MAX_RECURSION
                      ) {
                        return propertyWalker(
                          baseIRI,
                          quad,
                          itemSchema,
                          rootSchema,
                          level + 1,
                          {
                            ...circularSet,
                            [itemRef]: (circularSet[itemRef] || 0) + 1,
                          },
                          options,
                          skipNextProps,
                          context,
                        );
                      }
                      return propertyWalker(
                        baseIRI,
                        quad,
                        itemSchema,
                        rootSchema,
                        level + 1,
                        circularSet,
                        options,
                        skipNextProps,
                        context,
                      );
                    }
                  }
                }),
              );
            } else if (!circularSet[ref] || circularSet[ref] < MAX_RECURSION) {
              val = propertyWalker(
                baseIRI,
                newNode as clownface.GraphPointer,
                resolved,
                rootSchema,
                level + 1,
                { ...circularSet, [ref]: (circularSet[ref] || 0) + 1 },
                options,
                skipNextProps,
                context,
              );
            }
          }
        } else if (schema.properties) {
          val = propertyWalker(
            baseIRI,
            newNode as clownface.GraphPointer,
            schema,
            rootSchema,
            level + 1,
            circularSet,
            options,
            skipNextProps,
            context,
          );
        } else if (schema.items) {
          val = filterUndefOrNull(
            newNode.map((quad) => {
              if (
                isJSONSchemaDefinition(schema.items) &&
                isJSONSchema(schema.items)
              ) {
                if (schema.items.$ref) {
                  const ref = schema.items.$ref;
                  const subSchema = resolveSchema(
                    schema.items as JsonSchema,
                    "",
                    rootSchema as JsonSchema,
                  );
                  const resolvedItems = unwrapRefChain(
                    subSchema as JSONSchema7,
                    rootSchema,
                  );
                  if (
                    resolvedItems &&
                    isJSONSchemaDefinition(
                      resolvedItems as JSONSchema7Definition,
                    ) &&
                    isJSONSchema(resolvedItems as JSONSchema7)
                  ) {
                    if (isPrimitiveSchema(resolvedItems)) {
                      return extractPrimitiveValue(
                        [quad.value],
                        normalizePrimitiveType(resolvedItems),
                      );
                    }
                    if ((circularSet[ref] || 0) < MAX_RECURSION) {
                      return propertyWalker(
                        baseIRI,
                        quad,
                        resolvedItems,
                        rootSchema,
                        level + 1,
                        { ...circularSet, [ref]: (circularSet[ref] || 0) + 1 },
                        options,
                        skipNextProps,
                        context,
                      );
                    }
                    return;
                  }
                } else if (schema.items.properties) {
                  return propertyWalker(
                    baseIRI,
                    quad,
                    schema.items,
                    rootSchema,
                    level + 1,
                    circularSet,
                    options,
                    skipNextProps,
                    context,
                  );
                }
                if (schema.items.type) {
                  const itemPrim = normalizePrimitiveType(
                    schema.items as JSONSchema7,
                  );
                  if (itemPrim) {
                    switch (itemPrim) {
                      case "integer":
                        return parseInt(quad.value);
                      case "number":
                        return parseFloat(quad.value);
                      case "boolean":
                        return quad.value === "true";
                      case "string":
                        return quad.value;
                      default:
                        return quad.value;
                    }
                  }
                  if (!Array.isArray(schema.items.type)) {
                    switch (schema.items.type) {
                      case "object":
                        return {};
                      case "array":
                        return [];
                      case "integer":
                        return parseInt(quad.value);
                      case "number":
                        return parseFloat(quad.value);
                      case "boolean":
                        return quad.value === "true";
                      case "string":
                        return quad.value;
                      default:
                        return quad.value;
                    }
                  }
                }
              }
            }),
          );
        } else if (schema.type === "array") {
          val = newNode.values;
        }
        if (!val) {
          const primitiveType = normalizePrimitiveType(schema as JSONSchema7);
          if (primitiveType && newNode.values) {
            switch (primitiveType) {
              case "number":
                val = parseFloat(newNode.values[0]);
                if (isNaN(val)) val = undefined;
                break;
              case "integer":
                val = parseInt(newNode.values[0]);
                if (isNaN(val)) val = undefined;
                break;
              case "boolean":
                val = isNil(newNode.values[0])
                  ? undefined
                  : newNode.values[0] === "true";
                break;
              case "string":
              default:
                val = newNode.values[0];
            }
          }
        }
      }
      return [property, val];
    })
    .filter(
      ([_, val]) =>
        !(val === undefined) &&
        !(val === null) &&
        !(
          options?.omitEmptyArrays &&
          Array.isArray(val) &&
          (val as any[]).length === 0
        ) &&
        !(
          options?.omitEmptyObjects &&
          typeof val === "object" &&
          Object.keys(val).length === 0
        ),
    );

  return {
    ...additionalProps,
    ...Object.fromEntries(entries),
  };
};
export const traverseGraphExtractBySchema = (
  baseIRI: string,
  iri: string,
  dataset: Dataset | DatasetCore,
  rootSchema: JSONSchema7,
  options: Partial<WalkerOptions>,
  context?: Record<string, string>,
) => {
  const tbbt = clownface({ dataset });
  const startNode: clownface.GraphPointer = tbbt.node(ds.namedNode(iri));
  const result = propertyWalker(
    baseIRI,
    startNode,
    rootSchema,
    rootSchema,
    0,
    {},
    options || {},
    false,
    context,
  );
  return result;
};
