import { JSONSchema7 } from "json-schema";
import { definitionNameFromRef } from "./definitionScope";
import { defs } from "./jsonSchema";
import { resolveSchema } from "./resolver";

/**
 * Side-schema / app config: owning class → slot → `RangeClass.inverseSlot`.
 */
export type InverseMap = Record<string, Record<string, string>>;

/**
 * Interface for inverse property annotations in JSON Schema
 * Uses the x- prefix to follow JSON Schema vendor extension conventions
 */
export interface InversePropertyAnnotation {
  /**
   * The name of the inverse property
   */
  inverseOf: string[];
  /**
   * Optional description of the inverse relationship
   */
  description?: string;
}

/**
 * Extended JSON Schema type that includes inverse property annotations
 */
export interface JSONSchemaWithInverseProperties extends JSONSchema7 {
  /**
   * Annotation for inverse properties
   * Follows JSON Schema vendor extension pattern with x- prefix
   */
  "x-inverseOf"?: InversePropertyAnnotation;
}

/**
 * Type guard to check if a schema has inverse property annotations
 */
function hasInversePropertyAnnotation(
  schema: JSONSchema7,
): schema is JSONSchemaWithInverseProperties {
  return (
    schema != null && typeof schema === "object" && "x-inverseOf" in schema
  );
}

/**
 * Extract inverse property annotation from a JSON Schema property
 */
export function getInversePropertyAnnotation(
  schema: JSONSchema7,
): InversePropertyAnnotation | undefined {
  if (hasInversePropertyAnnotation(schema)) {
    return schema["x-inverseOf"];
  }
  return undefined;
}

export type InversePropertyResolution = {
  path: string[];
  typeName: string;
  schema: JSONSchema7 | undefined;
};

export type InversePropertyData = {
  path: string[];
  typeName: string;
  schema: JSONSchema7 | undefined;
  entityIRIs: string[];
};

/** Parse `Person.groups` → range class + inverse slot path. */
export function parseInverseTarget(
  target: string,
): { typeName: string; path: string[] } | null {
  const dot = target.indexOf(".");
  if (dot <= 0 || dot >= target.length - 1) return null;
  const typeName = target.slice(0, dot);
  const slot = target.slice(dot + 1);
  if (!typeName || !slot) return null;
  return { typeName, path: [slot] };
}

/** Legacy JSON Pointer → `RangeClass.inverseSlot` target string. */
export function inverseTargetFromLegacyPointer(pointer: string): string | null {
  const parts = pointer.split("/");
  const idx =
    parts.indexOf("definitions") !== -1
      ? parts.indexOf("definitions") + 1
      : parts.indexOf("$defs") + 1;
  if (idx === 0) return null;
  const path = parts.slice(idx).filter((p) => p !== "properties");
  const typeName = path.shift();
  const slot = path[0];
  if (!typeName || !slot) return null;
  return `${typeName}.${slot}`;
}

function resolveInverseTargetString(
  target: string,
  rootSchema: JSONSchema7,
): InversePropertyResolution | null {
  const parsed = parseInverseTarget(target);
  if (!parsed) return null;
  const { typeName, path } = parsed;
  const slot = path[0];
  if (!slot) return null;
  const defKey = defs(rootSchema);
  const def = defKey[typeName];
  const propSchema =
    def && typeof def === "object" && def.properties
      ? (def.properties[slot] as JSONSchema7 | undefined)
      : undefined;
  return { path, typeName, schema: propSchema };
}

/**
 * Resolve inverse metadata for a property using {@link InverseMap} and/or legacy
 * `x-inverseOf` on the property schema.
 */
export function resolveInverseForProperty(
  typeName: string | undefined,
  propertyName: string,
  propertySchema: JSONSchema7,
  rootSchema: JSONSchema7,
  inverseMap?: InverseMap,
): InversePropertyResolution[] | null {
  const mapTarget =
    typeName != null ? inverseMap?.[typeName]?.[propertyName] : undefined;
  if (mapTarget) {
    const resolved = resolveInverseTargetString(mapTarget, rootSchema);
    return resolved ? [resolved] : null;
  }
  return resolveInverseProperties(propertySchema, rootSchema);
}

/**
 * @deprecated Reads legacy `x-inverseOf` from hand-written schemas. Prefer side-schema `inverses` / {@link InverseMap}.
 */
export const resolveInverseProperties: (
  schema: JSONSchemaWithInverseProperties,
  rootSchema: JSONSchemaWithInverseProperties,
) => InversePropertyResolution[] | null = (schema, rootSchema) => {
  const inverseProperties = schema["x-inverseOf"]?.inverseOf;
  if (!inverseProperties) return null;
  return inverseProperties
    .map((inverseProperty) => {
      let path = inverseProperty.split("/");
      const index =
        path.indexOf("definitions") !== -1
          ? path.indexOf("definitions") + 1
          : path.indexOf("$defs") + 1;
      path = path.slice(index).filter((p) => p !== "properties");
      const typeName = path.shift();
      if (!typeName) return null;
      const resolvedSubSchema = resolveSchema(
        rootSchema,
        inverseProperty,
        rootSchema,
      );
      return { path, typeName, schema: resolvedSubSchema as JSONSchema7 };
    })
    .filter((p) => p !== null);
};

/**
 * @deprecated Build an {@link InverseMap} from legacy `x-inverseOf` keywords in a schema document.
 */
export function inverseMapFromSchema(schema: JSONSchema7): InverseMap {
  const map: InverseMap = {};

  const collectFromType = (typeName: string, node: JSONSchema7) => {
    if (!node.properties) return;
    for (const [slot, propSchema] of Object.entries(node.properties)) {
      if (typeof propSchema === "boolean") continue;
      const ann = getInversePropertyAnnotation(propSchema as JSONSchema7);
      const pointer = ann?.inverseOf?.[0];
      if (!pointer) continue;
      const target = inverseTargetFromLegacyPointer(pointer);
      if (target) {
        map[typeName] ??= {};
        map[typeName][slot] = target;
      }
    }
  };

  for (const [typeName, def] of Object.entries(defs(schema))) {
    if (!def || typeof def === "boolean") continue;
    collectFromType(typeName, def);
  }

  return map;
}

/** Shallow-merge per-type slot maps (later maps override). */
export function mergeInverseMaps(
  ...maps: (InverseMap | undefined)[]
): InverseMap {
  const out: InverseMap = {};
  for (const m of maps) {
    if (!m) continue;
    for (const [typeName, slots] of Object.entries(m)) {
      out[typeName] = { ...(out[typeName] ?? {}), ...slots };
    }
  }
  return out;
}

/** Side-schema / explicit map merged on top of legacy schema keywords. */
export function effectiveInverseMap(
  rootSchema: JSONSchema7,
  inverseMap?: InverseMap,
): InverseMap {
  return mergeInverseMaps(inverseMapFromSchema(rootSchema), inverseMap);
}

export type GetInversePropertiesOptions = {
  typeName?: string;
  inverseMap?: InverseMap;
};

function typeNameForNestedProperty(
  propertySchema: JSONSchema7,
): string | undefined {
  if (propertySchema.$ref) {
    return definitionNameFromRef(propertySchema.$ref);
  }
  if (
    propertySchema.type === "array" &&
    typeof propertySchema.items === "object" &&
    !Array.isArray(propertySchema.items)
  ) {
    const items = propertySchema.items as JSONSchema7;
    if (items.$ref) return definitionNameFromRef(items.$ref);
  }
  return undefined;
}

export const getInverseProperties = (
  rootSchema: JSONSchema7,
  schema: JSONSchema7,
  data: any,
  options?: GetInversePropertiesOptions,
): InversePropertyData[] => {
  const inverseMap = effectiveInverseMap(rootSchema, options?.inverseMap);

  if (schema["x-inverseOf"]) {
    const resolvedInverse = resolveInverseProperties(schema, rootSchema);
    if (resolvedInverse) {
      return resolvedInverse.map((inverse) => ({
        path: inverse.path,
        typeName: inverse.typeName,
        schema: inverse.schema,
        entityIRIs: (Array.isArray(data) ? data : [data])
          .map((d) => d?.["@id"])
          .filter((iri): iri is string => iri != null),
      }));
    }
  }

  if (schema.type === "object" && schema.properties) {
    return Object.entries(schema.properties)
      .map(([key, value]) => {
        const propSchema = value as JSONSchema7;
        const propInverse = resolveInverseForProperty(
          options?.typeName,
          key,
          propSchema,
          rootSchema,
          inverseMap,
        );
        if (propInverse) {
          return propInverse.map((inverse) => ({
            path: inverse.path,
            typeName: inverse.typeName,
            schema: inverse.schema,
            entityIRIs: (Array.isArray(data?.[key]) ? data[key] : [data?.[key]])
              .map((d: { ["@id"]?: string }) => d?.["@id"])
              .filter((iri): iri is string => iri != null),
          }));
        }
        const childTypeName =
          typeNameForNestedProperty(propSchema) ?? options?.typeName;
        return getInverseProperties(rootSchema, propSchema, data?.[key], {
          ...options,
          typeName: childTypeName,
        });
      })
      .flat();
  }
  if (schema.type === "array" && typeof schema.items === "object") {
    return getInverseProperties(
      rootSchema,
      schema.items as JSONSchema7,
      data,
      options,
    );
  }
  return [];
};
