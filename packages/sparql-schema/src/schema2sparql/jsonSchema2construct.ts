import {
  isJSONSchema,
  isJSONSchemaDefinition,
  JSONSchemaWithInverseProperties,
  resolveInverseProperties,
  resolveSchema,
} from "@graviola/json-schema-utils";
import { Variable } from "@rdfjs/types";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";

import { iriRef } from "../sparqlTerms";

const propertiesContainStopSymbol = (
  properties: object,
  stopSymbols: string[],
) => {
  const propKeys = Object.keys(properties);
  for (const stopSymbol of stopSymbols) {
    if (propKeys.includes(stopSymbol)) return true;
  }
  return false;
};

const MAX_RECURSION = 4;
const makePrefixed = (key: string) => (key.includes(":") ? key : `:${key}`);
const makePrefixedProperyPath = (path: string[]) =>
  path.map((key) => makePrefixed(key)).join("/");
const mkSubject = (subjectURI: string) =>
  subjectURI.startsWith("?") ? subjectURI : iriRef(subjectURI);

/**
 * Resolve the object sub-schema a property points at (via `$ref`, inline
 * `properties`, or array `items`), or `undefined` when the property is a
 * primitive / non-recursable value.
 */
const resolveNestedObjectSchema = (
  schema: JSONSchemaWithInverseProperties,
  rootSchema: JSONSchemaWithInverseProperties,
): JSONSchema7 | undefined => {
  if (schema.$ref) {
    const resolved = resolveSchema(
      schema as JSONSchema7,
      "",
      rootSchema as JSONSchema7,
    );
    return resolved && (resolved as JSONSchema7).properties
      ? (resolved as JSONSchema7)
      : undefined;
  }
  if (schema.properties) {
    return schema as JSONSchema7;
  }
  if (
    schema.items &&
    isJSONSchemaDefinition(schema.items) &&
    isJSONSchema(schema.items)
  ) {
    if (schema.items.$ref) {
      const resolved = resolveSchema(
        schema.items as JSONSchema7,
        "",
        rootSchema as JSONSchema7,
      );
      return resolved &&
        isJSONSchemaDefinition(resolved as JSONSchema7Definition) &&
        isJSONSchema(resolved as JSONSchema7)
        ? (resolved as JSONSchema7)
        : undefined;
    }
    if (schema.items.properties) {
      return schema.items as JSONSchema7;
    }
  }
  return undefined;
};

/**
 * Build the DELETE template (`construct`) and matching WHERE patterns for the
 * Concise Bounded Description (CBD) of `subjectURI` as described by `rootSchema`.
 *
 * Used exclusively by the write path (`save` → DELETE/INSERT, `remove` → DELETE).
 * Reads use `traversalSchema2construct`.
 *
 * Boundary semantics — two independent guards decide how far the template
 * expands into nested objects:
 *
 * 1. **Schema (TBox) guard:** recursion stops at sub-schemas whose `properties`
 *    contain one of `stopSymbols` (callers pass `["@id"]`, i.e. named-entity
 *    definitions). This is the declared boundary.
 *
 * 2. **Data (ABox) guard:** every nested expansion is anchored in its own
 *    `OPTIONAL { <link> FILTER(isBlank(?o)) … }` group. Only *anonymous*
 *    (blank-node) objects owned by the subject are ever expanded; IRIs are
 *    never followed, regardless of what the schema declares. This is the CBD
 *    definition proper and protects linked named entities (e.g. a
 *    `Location.parent` pointing at another `Location`) from being wiped when
 *    the schema artifact omits `@id` on referenced definitions.
 *
 * The link triple itself (`<s> :p ?o`) is always matched in a separate
 * OPTIONAL so stale references are removed even when the target is an IRI.
 * Inside nested (level > 0) groups every pattern is OPTIONAL: for deletion we
 * want maximal matching, `required` is irrelevant there.
 */
export const jsonSchema2construct: (
  subjectURI: string | Variable,
  rootSchema: JSONSchemaWithInverseProperties,
  stopSymbols?: string[],
  excludedProperties?: string[],
  maxRecursion?: number,
) => { whereRequired: string; whereOptionals: string; construct: string } = (
  subjectURI,
  rootSchema,
  stopSymbols = [],
  excludedProperties = [],
  maxRecursion = MAX_RECURSION,
) => {
  let construct = "",
    whereOptionals = "",
    varIndex = 0;
  const whereRequired = "";
  const s = mkSubject(
    typeof subjectURI === "string" ? subjectURI : `?${subjectURI.value}`,
  );
  const propertiesToSPARQLPatterns = (
    sP: string,
    subSchema: JSONSchemaWithInverseProperties,
    level: number,
  ) => {
    if (level > maxRecursion) {
      return;
    }
    if (
      level > 0 &&
      propertiesContainStopSymbol(subSchema.properties || {}, stopSymbols)
    ) {
      return;
    }
    const __type = `?__type_${varIndex++}`;
    whereOptionals += `OPTIONAL { ${sP} a ${__type} . }\n`;
    construct += `${sP} a ${__type} .\n`;
    Object.entries(subSchema.properties || {}).forEach(([property, schema]) => {
      if (!isJSONSchema(schema) || excludedProperties.includes(property)) {
        return;
      }
      // Nested levels are always optional: DELETE wants maximal matching.
      const required = level === 0 && subSchema.required?.includes(property);
      const p = makePrefixed(property);
      const o = `?${property}_${varIndex++}`;

      // 1. link pattern(s) between subject and object
      let linkPatterns: string[];
      if (schema["x-inverseOf"]) {
        const resolvedInverse = resolveInverseProperties(schema, rootSchema);
        linkPatterns = (resolvedInverse ?? []).map(
          (inverse) => `${o} ${makePrefixedProperyPath(inverse.path)} ${sP} .`,
        );
      } else {
        linkPatterns = [`${sP} ${p} ${o} .`];
      }
      if (linkPatterns.length === 0) {
        return;
      }
      for (const link of linkPatterns) {
        construct += `${sP} ${p} ${o} .\n`;
        whereOptionals += required ? `${link}\n` : `OPTIONAL {\n${link}\n}\n`;
      }

      // 2. nested expansion, guarded to anonymous (blank-node) objects only
      const nested = resolveNestedObjectSchema(schema, rootSchema);
      if (
        !nested ||
        !nested.properties ||
        propertiesContainStopSymbol(nested.properties, stopSymbols) ||
        level + 1 > maxRecursion
      ) {
        return;
      }
      const anchor =
        linkPatterns.length === 1
          ? linkPatterns[0]
          : linkPatterns.map((link) => `{ ${link} }`).join(" UNION ");
      whereOptionals += `OPTIONAL {\n${anchor}\nFILTER(isBlank(${o}))\n`;
      propertiesToSPARQLPatterns(o, nested, level + 1);
      whereOptionals += "}\n";
    });
  };
  propertiesToSPARQLPatterns(s, rootSchema, 0);
  if (
    isJSONSchemaDefinition(rootSchema.items) &&
    isJSONSchema(rootSchema.items) &&
    rootSchema.items.properties
  ) {
    propertiesToSPARQLPatterns(s, rootSchema.items, 0);
  }
  return { construct, whereRequired, whereOptionals };
};
