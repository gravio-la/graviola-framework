import {
  defs,
  isJSONSchema,
  isJSONSchemaDefinition,
  isPrimitive,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

import type {
  JsonSchema2PrismaResult,
  PersistenceManifest,
  PersistencePropertyDescriptor,
  PersistenceRepresentation,
  PersistenceTypeManifest,
} from "./persistenceManifest";

export type {
  JsonSchema2PrismaResult,
  PersistenceManifest,
  PersistencePropertyDescriptor,
  PersistenceRepresentation,
  PersistenceTypeManifest,
} from "./persistenceManifest";

const primitiveToPrisma = (type: string, requiredQM: string): string => {
  switch (type) {
    case "string":
      return `String${requiredQM}`;
    case "number":
      return `Float${requiredQM}`;
    case "integer":
      return `Int${requiredQM}`;
    case "boolean":
      return `Boolean${requiredQM} @default(false)`;
    default:
      return `String${requiredQM}`;
  }
};

const primitiveValueType = (
  type: string,
): "String" | "Int" | "Float" | "Boolean" => {
  switch (type) {
    case "integer":
      return "Int";
    case "number":
      return "Float";
    case "boolean":
      return "Boolean";
    default:
      return "String";
  }
};

const prefixed = (prefix: string, name: string): string => `${prefix}${name}`;
const replaceAt = (str: string) => str.replace("@", "");

type PropertiesToPrismaReturnType = {
  directProperties: string[];
  externalComplementaryProperties: {
    tableName: string;
    property: string;
  }[];
  /** Composite `type` blocks for Mongo embedded documents */
  compositeTypes?: {
    typeName: string;
    properties: string[];
  }[];
  /** Manifest entries keyed by property name (relative to current type) */
  manifestEntries: Record<string, PersistencePropertyDescriptor>;
};

export type PropertiesToPrismaOptions = {
  databaseProvider?: "sqlite" | "postgresql" | "mysql" | "mongodb";
  reverseMap: Record<string, string>;
  /**
   * Force representation for primitive arrays.
   * Default: childTable for SQL, scalarList for Mongo.
   * Postgres may override to scalarList when preferred.
   */
  listRepresentation?: "childTable" | "scalarList";
};

const emptyResult = (): PropertiesToPrismaReturnType => ({
  directProperties: [],
  externalComplementaryProperties: [],
  compositeTypes: [],
  manifestEntries: {},
});

const direct = (
  prop: string,
  manifestKey?: string,
  descriptor?: PersistencePropertyDescriptor,
): PropertiesToPrismaReturnType => ({
  directProperties: prop ? [prop] : [],
  externalComplementaryProperties: [],
  compositeTypes: [],
  manifestEntries:
    manifestKey && descriptor ? { [manifestKey]: descriptor } : {},
});

const combine = (
  properties: PropertiesToPrismaReturnType[],
): PropertiesToPrismaReturnType => {
  return {
    directProperties: properties.flatMap((p) => p.directProperties),
    externalComplementaryProperties: properties.flatMap(
      (p) => p.externalComplementaryProperties || [],
    ),
    compositeTypes: properties.flatMap((p) => p.compositeTypes || []),
    manifestEntries: Object.assign(
      {},
      ...properties.map((p) => p.manifestEntries),
    ),
  };
};

function resolvePrimitiveListRep(
  options?: PropertiesToPrismaOptions,
): "childTable" | "scalarList" {
  if (options?.listRepresentation) return options.listRepresentation;
  if (options?.databaseProvider === "mongodb") return "scalarList";
  return "childTable";
}

function resolveAnonymousListRep(
  options?: PropertiesToPrismaOptions,
): "childTable" | "embedded" {
  if (options?.databaseProvider === "mongodb") return "embedded";
  return "childTable";
}

function emitSqlPrimitiveChildTable(
  typeName: string,
  propName: string,
  propPrefix: string,
  valueType: "String" | "Int" | "Float" | "Boolean",
): PropertiesToPrismaReturnType {
  const childModel = `${typeName}_${propPrefix}${propName}`;
  const parentFk = `${typeName}_id`;
  return {
    directProperties: [`${propName} ${childModel}[]`],
    externalComplementaryProperties: [
      { tableName: childModel, property: `id String @id` },
      { tableName: childModel, property: `value ${valueType}` },
      { tableName: childModel, property: `position Int` },
      { tableName: childModel, property: `${parentFk} String` },
      {
        tableName: childModel,
        property: `${typeName} ${typeName} @relation(fields: [${parentFk}], references: [id], onDelete: Cascade)`,
      },
      { tableName: childModel, property: `@@index([${parentFk}])` },
      { tableName: childModel, property: `@@index([value])` },
    ],
    compositeTypes: [],
    manifestEntries: {
      [propName]: {
        representation: "childTable",
        childModel,
        valueType,
        parentFk,
        parentRelation: typeName,
      },
    },
  };
}

function emitMongoScalarList(
  propName: string,
  valueType: "String" | "Int" | "Float" | "Boolean",
): PropertiesToPrismaReturnType {
  return {
    directProperties: [`${propName} ${valueType}[]`],
    externalComplementaryProperties: [],
    compositeTypes: [],
    manifestEntries: {
      [propName]: {
        representation: "scalarList",
        valueType,
      },
    },
  };
}

/**
 * Recursively emit SQL child model fields for an anonymous object schema.
 * Singular nested objects are underscore-flattened; nested arrays get further child tables.
 */
function emitAnonymousObjectFields(
  parentModel: string,
  rootTypeName: string,
  properties: JSONSchema7["properties"] = {},
  required: JSONSchema7["required"],
  options?: PropertiesToPrismaOptions,
  fieldPrefix = "",
): PropertiesToPrismaReturnType {
  const qm = (propName: string) => (required?.includes(propName) ? "" : "?");
  const parts: PropertiesToPrismaReturnType[] = [];
  const nestedManifest: Record<string, PersistencePropertyDescriptor> = {};

  for (const [propName, propSchema] of Object.entries(properties)) {
    if (!isJSONSchema(propSchema)) continue;
    const fieldName = `${fieldPrefix}${propName}`;

    // Nested array of primitives
    if (
      propSchema.type === "array" &&
      isJSONSchemaDefinition(propSchema.items) &&
      isJSONSchema(propSchema.items) &&
      typeof propSchema.items.type === "string" &&
      isPrimitive(propSchema.items.type) &&
      !propSchema.items.properties
    ) {
      const valueType = primitiveValueType(propSchema.items.type);
      const listRep = resolvePrimitiveListRep(options);
      if (listRep === "scalarList") {
        // Only valid when parent is a Mongo composite — handled separately
        parts.push(
          direct(`${fieldName} ${valueType}[]`, propName, {
            representation: "scalarList",
            valueType,
          }),
        );
        nestedManifest[propName] = {
          representation: "scalarList",
          valueType,
        };
      } else {
        const child = emitSqlPrimitiveChildTable(
          parentModel,
          propName,
          fieldPrefix,
          valueType,
        );
        // Relation field on parent model uses fieldName
        child.directProperties = [
          `${fieldName} ${child.manifestEntries[propName].childModel}[]`,
        ];
        // Fix child model name to include fieldPrefix path
        const childModel = `${parentModel}_${fieldPrefix}${propName}`;
        child.externalComplementaryProperties =
          child.externalComplementaryProperties.map((ec) => ({
            ...ec,
            tableName: childModel,
            property: ec.property
              .replaceAll(`${parentModel}_id`, `${parentModel}_id`)
              .replace(
                `${parentModel} ${parentModel} @relation`,
                `${parentModel} ${parentModel} @relation`,
              ),
          }));
        // Rebuild child with correct names
        const parentFk = `${parentModel}_id`;
        parts.push({
          directProperties: [`${fieldName} ${childModel}[]`],
          externalComplementaryProperties: [
            { tableName: childModel, property: `id String @id` },
            { tableName: childModel, property: `value ${valueType}` },
            { tableName: childModel, property: `position Int` },
            { tableName: childModel, property: `${parentFk} String` },
            {
              tableName: childModel,
              property: `${parentModel} ${parentModel} @relation(fields: [${parentFk}], references: [id], onDelete: Cascade)`,
            },
            { tableName: childModel, property: `@@index([${parentFk}])` },
            { tableName: childModel, property: `@@index([value])` },
          ],
          compositeTypes: [],
          manifestEntries: {},
        });
        nestedManifest[propName] = {
          representation: "childTable",
          childModel,
          valueType,
          parentFk,
          parentRelation: parentModel,
        };
      }
      continue;
    }

    // Nested array of anonymous objects — recurse one level further
    if (
      propSchema.type === "array" &&
      isJSONSchemaDefinition(propSchema.items) &&
      isJSONSchema(propSchema.items) &&
      propSchema.items.properties
    ) {
      const childModel = `${parentModel}_${fieldPrefix}${propName}`;
      const parentFk = `${parentModel}_id`;
      const sub = emitAnonymousObjectFields(
        childModel,
        rootTypeName,
        propSchema.items.properties,
        propSchema.items.required,
        options,
        "",
      );
      parts.push({
        directProperties: [`${fieldName} ${childModel}[]`],
        externalComplementaryProperties: [
          { tableName: childModel, property: `id String @id` },
          { tableName: childModel, property: `position Int` },
          { tableName: childModel, property: `${parentFk} String` },
          {
            tableName: childModel,
            property: `${parentModel} ${parentModel} @relation(fields: [${parentFk}], references: [id], onDelete: Cascade)`,
          },
          { tableName: childModel, property: `@@index([${parentFk}])` },
          ...sub.directProperties.map((dp) => ({
            tableName: childModel,
            property: dp,
          })),
          ...sub.externalComplementaryProperties,
        ],
        compositeTypes: sub.compositeTypes,
        manifestEntries: {},
      });
      nestedManifest[propName] = {
        representation: "childTable",
        childModel,
        parentFk,
        parentRelation: parentModel,
        properties: sub.manifestEntries,
      };
      continue;
    }

    // Singular nested object — flatten with underscore; nested arrays become child tables
    if (
      propSchema.type === "object" &&
      propSchema.properties &&
      !propSchema.$ref
    ) {
      const flat = emitAnonymousObjectFields(
        parentModel,
        rootTypeName,
        propSchema.properties,
        propSchema.required,
        options,
        `${fieldName}_`,
      );
      parts.push({
        ...flat,
        manifestEntries: {},
      });
      nestedManifest[propName] = {
        representation: "flattened",
        properties: flat.manifestEntries,
      };
      continue;
    }

    // Primitive scalar
    if (propSchema.type && typeof propSchema.type === "string") {
      if (isPrimitive(propSchema.type)) {
        if (propSchema.type === "string" && propSchema.format === "date-time") {
          parts.push(direct(`${fieldName} DateTime${qm(propName)}`));
        } else {
          parts.push(
            direct(
              `${fieldName} ${primitiveToPrisma(propSchema.type, qm(propName))}`,
            ),
          );
        }
        nestedManifest[propName] = { representation: "scalar" };
      }
    }
  }

  const combined = combine(parts);
  combined.manifestEntries = nestedManifest;
  return combined;
}

/**
 * Emit Mongo composite type blocks for an anonymous object.
 */
function emitMongoCompositeType(
  compositeName: string,
  properties: JSONSchema7["properties"] = {},
  required: JSONSchema7["required"],
): {
  properties: string[];
  compositeTypes: { typeName: string; properties: string[] }[];
  manifestEntries: Record<string, PersistencePropertyDescriptor>;
} {
  const qm = (propName: string) => (required?.includes(propName) ? "" : "?");
  const fields: string[] = [];
  const composites: { typeName: string; properties: string[] }[] = [];
  const manifest: Record<string, PersistencePropertyDescriptor> = {};

  for (const [propName, propSchema] of Object.entries(properties ?? {})) {
    if (!isJSONSchema(propSchema)) continue;

    if (
      propSchema.type === "array" &&
      isJSONSchemaDefinition(propSchema.items) &&
      isJSONSchema(propSchema.items) &&
      typeof propSchema.items.type === "string" &&
      isPrimitive(propSchema.items.type)
    ) {
      const valueType = primitiveValueType(propSchema.items.type);
      fields.push(`${propName} ${valueType}[]`);
      manifest[propName] = { representation: "scalarList", valueType };
      continue;
    }

    if (
      propSchema.type === "object" &&
      propSchema.properties &&
      !propSchema.$ref
    ) {
      const nestedName = `${compositeName}${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
      const nested = emitMongoCompositeType(
        nestedName,
        propSchema.properties,
        propSchema.required,
      );
      fields.push(`${propName} ${nestedName}?`);
      composites.push(
        { typeName: nestedName, properties: nested.properties },
        ...nested.compositeTypes,
      );
      manifest[propName] = {
        representation: "embedded",
        properties: nested.manifestEntries,
      };
      continue;
    }

    if (
      propSchema.type === "array" &&
      isJSONSchemaDefinition(propSchema.items) &&
      isJSONSchema(propSchema.items) &&
      propSchema.items.properties
    ) {
      const nestedName = `${compositeName}${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
      const nested = emitMongoCompositeType(
        nestedName,
        propSchema.items.properties,
        propSchema.items.required,
      );
      fields.push(`${propName} ${nestedName}[]`);
      composites.push(
        { typeName: nestedName, properties: nested.properties },
        ...nested.compositeTypes,
      );
      manifest[propName] = {
        representation: "embedded",
        properties: nested.manifestEntries,
      };
      continue;
    }

    if (
      propSchema.type &&
      typeof propSchema.type === "string" &&
      isPrimitive(propSchema.type)
    ) {
      if (propSchema.type === "string" && propSchema.format === "date-time") {
        fields.push(`${propName} DateTime${qm(propName)}`);
      } else {
        fields.push(
          `${propName} ${primitiveToPrisma(propSchema.type, qm(propName))}`,
        );
      }
      manifest[propName] = { representation: "scalar" };
    }
  }

  return {
    properties: fields,
    compositeTypes: composites,
    manifestEntries: manifest,
  };
}

/**
 * will generate the prisma properties for a given schema based on the properties object
 */
export const propertiesToPrisma = (
  typeName: string,
  properties: JSONSchema7["properties"] = {},
  required: JSONSchema7["required"],
  visited: WeakSet<any>,
  prefix: string = "",
  propPrefix = "",
  options?: PropertiesToPrismaOptions,
): PropertiesToPrismaReturnType => {
  const qm = (propName: string) => (required?.includes(propName) ? "" : "?");
  return combine(
    Object.entries(properties).map(([propName, propSchema]) => {
      const pp = prefixed(prefix, propName);
      if (!isJSONSchema(propSchema)) return emptyResult();

      // $ref to-one
      if (propSchema.$ref) {
        const type = propSchema.$ref.split("/").pop();
        const reverseProperty =
          options?.reverseMap[pp] || `${pp}_to_${typeName}_reverse`;
        if (typeof type == "string") {
          return {
            directProperties: [
              `${pp}_id String${qm(propName)}`,
              `${pp} ${type}${qm(propName)}  @relation("${propName}", fields: [${pp}_id], references: [id])`,
            ],
            externalComplementaryProperties: [
              {
                tableName: type,
                property: `${reverseProperty} ${typeName}[] @relation("${propName}")`,
              },
            ],
            compositeTypes: [],
            manifestEntries: {
              [propName]: { representation: "relationToOne" },
            },
          };
        }
      }

      if (propSchema.items) {
        // Array of $ref → M2M
        if (
          isJSONSchemaDefinition(propSchema.items) &&
          (propSchema.items as any).$ref
        ) {
          const reverseProperty =
            options?.reverseMap[pp] || `${pp}_to_${typeName}_reverse`;
          const type = (propSchema.items as any).$ref
            .split("/")
            .pop() as string;
          const relationName = `${typeName}_${pp}_${type}`;
          if (options?.databaseProvider === "mongodb") {
            return {
              directProperties: [
                `${pp}_ids String[]`,
                `${pp} ${type}[] @relation(fields: [${pp}_ids], references: [id])`,
              ],
              externalComplementaryProperties: [
                {
                  tableName: type,
                  property: `${reverseProperty}_ids String[]`,
                },
                {
                  tableName: type,
                  property: `${reverseProperty} ${typeName}[] @relation(fields: [${reverseProperty}_ids], references: [id])`,
                },
              ],
              compositeTypes: [],
              manifestEntries: {
                [propName]: { representation: "relationM2M" },
              },
            };
          }
          return {
            directProperties: [
              `${pp} ${type}[] @relation(name: "${relationName}")`,
            ],
            externalComplementaryProperties: [
              {
                tableName: type,
                property: `${reverseProperty} ${typeName}[] @relation(name: "${relationName}")`,
              },
            ],
            compositeTypes: [],
            manifestEntries: {
              [propName]: { representation: "relationM2M" },
            },
          };
        }

        // Array of primitives
        if (
          isJSONSchemaDefinition(propSchema.items) &&
          isJSONSchema(propSchema.items) &&
          typeof propSchema.items.type === "string" &&
          isPrimitive(propSchema.items.type) &&
          !propSchema.items.properties
        ) {
          const valueType = primitiveValueType(propSchema.items.type);
          const listRep = resolvePrimitiveListRep(options);
          if (listRep === "scalarList") {
            return emitMongoScalarList(pp, valueType);
          }
          return emitSqlPrimitiveChildTable(
            typeName,
            propName,
            propPrefix,
            valueType,
          );
        }

        // Array of anonymous objects
        if (
          isJSONSchemaDefinition(propSchema.items) &&
          isJSONSchema(propSchema.items) &&
          propSchema.items.properties
        ) {
          const anonRep = resolveAnonymousListRep(options);
          if (anonRep === "embedded") {
            const compositeName = `${typeName}${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
            const composite = emitMongoCompositeType(
              compositeName,
              propSchema.items.properties,
              propSchema.items.required,
            );
            return {
              directProperties: [`${pp} ${compositeName}[]`],
              externalComplementaryProperties: [],
              compositeTypes: [
                {
                  typeName: compositeName,
                  properties: composite.properties,
                },
                ...composite.compositeTypes,
              ],
              manifestEntries: {
                [propName]: {
                  representation: "embedded",
                  properties: composite.manifestEntries,
                },
              },
            };
          }

          // SQL child table
          const childModel = `${typeName}_${propPrefix}${propName}`;
          const parentFk = `${typeName}_id`;
          const sub = emitAnonymousObjectFields(
            childModel,
            typeName,
            propSchema.items.properties,
            propSchema.items.required,
            options,
            "",
          );
          return {
            directProperties: [`${pp} ${childModel}[]`],
            externalComplementaryProperties: [
              { tableName: childModel, property: `id String @id` },
              { tableName: childModel, property: `position Int` },
              { tableName: childModel, property: `${parentFk} String` },
              {
                tableName: childModel,
                property: `${typeName} ${typeName} @relation(fields: [${parentFk}], references: [id], onDelete: Cascade)`,
              },
              { tableName: childModel, property: `@@index([${parentFk}])` },
              ...sub.directProperties.map((dp) => ({
                tableName: childModel,
                property: dp,
              })),
              ...sub.externalComplementaryProperties,
            ],
            compositeTypes: sub.compositeTypes,
            manifestEntries: {
              [propName]: {
                representation: "childTable",
                childModel,
                parentFk,
                parentRelation: typeName,
                properties: sub.manifestEntries,
              },
            },
          };
        }
      }

      if (propSchema.type && typeof propSchema.type === "string") {
        if (isPrimitive(propSchema.type)) {
          if (propSchema.type === "string" && propSchema.enum) {
            return direct(
              `${pp} ${propSchema.enum.map((e: any) => `"${e}"`).join(" | ")}`,
              propName,
              { representation: "scalar" },
            );
          }
          if (
            propSchema.type === "string" &&
            propSchema.format === "date-time"
          ) {
            return direct(`${pp} DateTime${qm(propName)}`, propName, {
              representation: "scalar",
            });
          }
          if (propName === "@id" && propSchema.type === "string") {
            if (options?.databaseProvider === "mongodb") {
              return direct(
                `${replaceAt(propName)} String @id @map("_id")`,
                "id",
                { representation: "scalar" },
              );
            }
            return direct(`${replaceAt(propName)} String @id`, "id", {
              representation: "scalar",
            });
          }
          if (propName === "id" && propSchema.type === "string") {
            if (options?.databaseProvider === "mongodb") {
              return direct(`id String @id @map("_id")`, "id", {
                representation: "scalar",
              });
            }
            return direct(`id String @id`, "id", { representation: "scalar" });
          }
          if (propName.startsWith("@") && propSchema.type === "string") {
            return direct(
              `${replaceAt(propName)} String${qm(propName)}`,
              replaceAt(propName),
              { representation: "scalar" },
            );
          }
          return direct(
            `${pp} ${primitiveToPrisma(propSchema.type, qm(propName))}`,
            propName,
            { representation: "scalar" },
          );
        } else if (propSchema.type === "object" && propSchema.properties) {
          // Singular inline object → underscore flatten
          const flat = propertiesToPrisma(
            typeName,
            propSchema.properties,
            propSchema.required,
            visited,
            `${pp}_`,
            undefined,
            options,
          );
          return {
            ...flat,
            manifestEntries: {
              [propName]: {
                representation: "flattened",
                properties: flat.manifestEntries,
              },
            },
          };
        }
      }
      return emptyResult();
    }),
  );
};

type ModelBuildInstruction = Record<string, string[]>;

const buildInstruction2ModelString = (
  buildInstructions: ModelBuildInstruction,
  compositeTypes: { typeName: string; properties: string[] }[] = [],
) => {
  const composites = compositeTypes
    .map(
      (c) => `type ${c.typeName} {
  ${c.properties.join("\n  ")}
}`,
    )
    .join("\n\n");

  const models = Object.entries(buildInstructions)
    .map(([modelName, properties]) => {
      return `model ${modelName} {
  ${properties.join("\n  ")}
}`;
    })
    .join("\n\n");

  return [composites, models].filter(Boolean).join("\n\n");
};

const addToModel = (
  modelName: string,
  buildInstruction: ModelBuildInstruction,
  propertiesReturn: PropertiesToPrismaReturnType,
) => {
  const model = buildInstruction[modelName] || [];
  const newBuildInstruction = {
    ...buildInstruction,
    [modelName]: [...model, ...propertiesReturn.directProperties],
  };
  return propertiesReturn.externalComplementaryProperties.reduce(
    (cur, { tableName, property }) => ({
      ...cur,
      [tableName]: [...(cur[tableName] || []), property],
    }),
    newBuildInstruction,
  );
};

/** @deprecated use n2MTable only for legacy callers — anonymous arrays now emit via propertiesToPrisma */
export const n2MTable = (
  _typeName: string,
  _properties: JSONSchema7["properties"] = {},
  _visited: WeakSet<any>,
  _prefix: string = "",
): string => {
  return "";
};

export const jsonSchema2PrismaWithManifest = (
  schema: JSONSchema7,
  visited: WeakSet<any>,
  options?: PropertiesToPrismaOptions,
): JsonSchema2PrismaResult => {
  let modelBuildInstruction: ModelBuildInstruction = {};
  const allComposites: { typeName: string; properties: string[] }[] = [];
  const typesManifest: Record<string, PersistenceTypeManifest> = {};
  const databaseProvider = options?.databaseProvider ?? "sqlite";

  if (isJSONSchema(schema)) {
    const definitions = defs(schema) as JSONSchema7["definitions"];
    if (schema.properties && schema.title) {
      const propertiesForModel = propertiesToPrisma(
        schema.title,
        schema.properties,
        schema.required,
        visited,
        undefined,
        undefined,
        options,
      );
      modelBuildInstruction = addToModel(
        schema.title,
        modelBuildInstruction,
        propertiesForModel,
      );
      allComposites.push(...(propertiesForModel.compositeTypes || []));
      typesManifest[schema.title] = propertiesForModel.manifestEntries;
    }
    if (definitions) {
      Object.entries(definitions).forEach(([typeName, typeSchema]) => {
        if (isJSONSchema(typeSchema) && typeSchema.properties) {
          const propertiesForModel = propertiesToPrisma(
            typeName,
            typeSchema.properties,
            typeSchema.required,
            visited,
            undefined,
            undefined,
            options,
          );
          modelBuildInstruction = addToModel(
            typeName,
            modelBuildInstruction,
            propertiesForModel,
          );
          allComposites.push(...(propertiesForModel.compositeTypes || []));
          typesManifest[typeName] = propertiesForModel.manifestEntries;
        }
      });
    }
  }

  // Deduplicate composite types by name
  const seenComposites = new Set<string>();
  const uniqueComposites = allComposites.filter((c) => {
    if (seenComposites.has(c.typeName)) return false;
    seenComposites.add(c.typeName);
    return true;
  });

  return {
    schemaText: buildInstruction2ModelString(
      modelBuildInstruction,
      uniqueComposites,
    ),
    manifest: {
      databaseProvider,
      types: typesManifest,
    },
  };
};

export const jsonSchema2Prisma = (
  schema: JSONSchema7,
  visited: WeakSet<any>,
  options?: PropertiesToPrismaOptions,
): string => {
  return jsonSchema2PrismaWithManifest(schema, visited, options).schemaText;
};

export const logPrismaSchemaWithPreamble = (
  schemaName: string,
  schema: JSONSchema7,
): string => {
  const preamble = `
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/edb-${schemaName}-client"
}

datasource db {
  provider = env("DATABASE_PROVIDER")
}
`;

  return `${preamble}${jsonSchema2Prisma(schema, new WeakSet<any>())}`;
};
