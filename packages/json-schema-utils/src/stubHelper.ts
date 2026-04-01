import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import isObject from "lodash-es/isObject";

import {
  defs,
  getDefintitionKey,
  isJSONSchema,
  isPrimitive,
} from "./jsonSchema";
import { resolveSchema } from "./resolver";

export type GenRequiredPropertiesFunction = (modelName: string) => string[];
export type GeneratePropertiesFunction = (
  modelName: string,
) => JSONSchema7["properties"];

/**
 * Keeps properties that are primitive-valued (direct type or $ref to a primitive definition).
 */
export const filterForPrimitives = (
  properties: JSONSchema7["properties"],
  rootSchema?: JSONSchema7,
) =>
  Object.fromEntries(
    Object.entries(properties || {}).filter(([, value]) => {
      if (typeof value !== "object" || value === null) return false;
      const v = value as JSONSchema7;
      if (isPrimitive(v.type as string | undefined) || v.oneOf) {
        return true;
      }
      if (v.$ref && rootSchema) {
        const resolved = resolveSchema(rootSchema, v.$ref, rootSchema);
        if (resolved && isJSONSchema(resolved as JSONSchema7Definition)) {
          const r = resolved as JSONSchema7;
          return isPrimitive(r.type as string | undefined) || Boolean(r.oneOf);
        }
      }
      return false;
    }),
  );

export type RefAppendOptions = {
  excludeType?: string[];
  excludeField?: string[];
  excludeSemanticPropertiesForType?: string[];
};

export type SchemaExpander = {
  additionalProperties: Record<string, JSONSchema7Definition>;
  options: RefAppendOptions;
};

/**
 * Checks if a schema represents an entity (has @id property indicating a linked data entity)
 * @param schema The schema to check
 * @param rootSchema The root schema for resolving references
 * @returns True if this schema represents an entity with @id
 */
const isEntitySchema = (
  schema: JSONSchema7,
  rootSchema: JSONSchema7,
): boolean => {
  // If it's a $ref, resolve it first
  if (schema.$ref) {
    const resolved = resolveSchema(rootSchema, schema.$ref, rootSchema);
    if (resolved && isJSONSchema(resolved as JSONSchema7Definition)) {
      return isEntitySchema(resolved as JSONSchema7, rootSchema);
    }
    return false;
  }

  // Check if schema has @id property (marker for linked data entities)
  if (schema.properties && "@id" in schema.properties) {
    return true;
  }

  return false;
};

export const recursivelyFindRefsAndAppendStub: (
  field: string,
  schema: JSONSchema7,
  options: RefAppendOptions,
  rootSchema?: JSONSchema7,
  isProperty?: boolean,
) => JSONSchema7 = (
  field,
  schema: JSONSchema7,
  options,
  rootSchema = schema,
  isProperty = false,
) => {
  if (options?.excludeField?.includes(field)) {
    return schema;
  }
  const definitionsKey = getDefintitionKey(rootSchema);
  if (schema.$ref) {
    if (
      options?.excludeType?.includes(
        schema.$ref.substring(
          `#/${definitionsKey}/`.length,
          schema.$ref.length,
        ),
      )
    ) {
      return schema;
    }
    // Only create stubs for entity schemas (those with @id property)
    // Non-entity refs (like internal Zod __schema0, __schema1) should be kept as-is
    if (isEntitySchema(schema, rootSchema)) {
      return {
        ...schema,
        $ref: `${schema.$ref}Stub`,
      };
    }
    return schema;
  }
  if (isObject(schema.items)) {
    return {
      ...schema,
      items: recursivelyFindRefsAndAppendStub(
        field,
        schema.items as JSONSchema7,
        options,
        rootSchema,
      ),
    };
  }
  if (schema.properties) {
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties).map(
          ([k, s]) =>
            [
              k,
              recursivelyFindRefsAndAppendStub(
                k,
                s as JSONSchema7,
                options,
                rootSchema,
                true,
              ),
            ] as [string, JSONSchema7Definition],
          options,
        ),
      ),
    };
  }
  if (defs(schema) && !isProperty) {
    return {
      ...schema,
      [definitionsKey]: Object.fromEntries(
        Object.entries(defs(schema)).map(
          ([k, s]) =>
            [
              k,
              recursivelyFindRefsAndAppendStub(
                k,
                s as JSONSchema7,
                options,
                rootSchema,
              ),
            ] as [string, JSONSchema7Definition],
          options,
        ),
      ),
    };
  }
  return schema;
};

export const definitionsToStubDefinitions = (
  definitions: JSONSchema7["definitions"],
  options?: RefAppendOptions,
  rootSchema?: JSONSchema7,
) =>
  Object.entries(definitions || {}).reduce((acc, [key, value]) => {
    if (options?.excludeType?.includes(key))
      return {
        ...acc,
        [key]: value,
      };

    // Only create stubs for entity schemas (those with @id property)
    // Skip non-entity definitions (like internal Zod __schema0, __schema1)
    if (isObject(value) && rootSchema) {
      const schema = value as JSONSchema7;
      // Check if this definition represents an entity
      if (!schema.properties || !("@id" in schema.properties)) {
        // Not an entity, skip stub creation
        return acc;
      }
    }

    const stubKey = `${key}Stub`;
    const stub = {
      ...((isObject(value) ? value : {}) as Object),
      required: [],
      properties: isObject(value)
        ? filterForPrimitives((value as any)?.properties, rootSchema)
        : undefined,
    };
    return {
      ...acc,
      [stubKey]: stub,
    };
  }, {}) as JSONSchema7["definitions"];

/**
 * extend Properties for a particular type, expects schema to have a properties key, thus it will not touch the definitions
 *
 * @param typeName
 * @param schema
 * @param generateSemanticProperties
 * @param requiredProperties
 */
export const extendProperties: (
  typeName: string,
  schema: JSONSchema7,
  generateSemanticProperties?: GeneratePropertiesFunction,
  requiredProperties?: GenRequiredPropertiesFunction,
) => JSONSchema7 = (
  typeName,
  schema,
  generateSemanticProperties,
  requiredProperties,
) =>
  ({
    ...schema,
    properties: {
      ...schema.properties,
      ...(generateSemanticProperties
        ? generateSemanticProperties(typeName)
        : {}),
    },
    ...(requiredProperties ? { required: requiredProperties(typeName) } : {}),
  }) as JSONSchema7;

/**
 * Extends the definitions of a JSON schema with additional properties.
 * Can be used to add @id and @type properties or others, like meta properties.
 *
 * @param schema the schema to extend
 * @param generateSemanticProperties a function that generates the properties for a given model name (key in the definitions part of the schema)
 * @param requiredProperties a function that generates the required properties for a given model name
 * @param options options to exclude certain types or fields from being extended
 */
export const extendDefinitionsWithProperties: (
  schema: JSONSchema7,
  generateSemanticProperties?: GeneratePropertiesFunction,
  requiredProperties?: GenRequiredPropertiesFunction,
  options?: RefAppendOptions,
) => JSONSchema7 = (
  schema,
  generateSemanticProperties,
  requiredProperties,
  options,
) => {
  const newDefs = Object.entries(defs(schema)).reduce<
    JSONSchema7["definitions"]
  >((acc, [key, value]) => {
    return options?.excludeSemanticPropertiesForType?.includes(key)
      ? { ...acc, [key]: value }
      : {
          ...acc,
          [key]: extendProperties(
            key,
            value as JSONSchema7,
            generateSemanticProperties,
            requiredProperties,
          ),
        };
  }, {}) as JSONSchema7["definitions"];
  return {
    ...schema,
    [getDefintitionKey(schema)]: newDefs,
  } as JSONSchema7;
};
export const prepareStubbedSchema = (
  schema: JSONSchema7,
  genJSONLDSemanticProperties?: GeneratePropertiesFunction,
  requiredProperties?: GenRequiredPropertiesFunction,
  options?: RefAppendOptions,
) => {
  const definitionsKey = getDefintitionKey(schema);

  const stubDefinitions = definitionsToStubDefinitions(
    defs(schema),
    options,
    schema,
  );
  const schemaWithRefStub = recursivelyFindRefsAndAppendStub(
    "root",
    schema,
    options || {},
    schema,
  );

  const stubbedSchema = {
    ...schemaWithRefStub,
    [definitionsKey]: {
      ...stubDefinitions,
      ...schemaWithRefStub[definitionsKey],
    },
  };

  return extendDefinitionsWithProperties(
    stubbedSchema,
    genJSONLDSemanticProperties,
    requiredProperties,
    options,
  );
};
