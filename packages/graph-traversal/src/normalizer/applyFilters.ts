import type { JSONSchema7 } from "json-schema";
import type {
  GraphTraversalFilterOptions,
  IncludePattern,
  PaginationOptions,
} from "@graviola/edb-core-types";
import { isRelationshipSchema } from "./resolveAllRefs";
import { validateFilter } from "../validators/filterValidator";

/**
 * Keys that denote typed-filter *operators* / control fields — not schema property names.
 * Prevents interpreting `{ amenities: { some: ... } }` as referencing a property literal `some`.
 */
const WHERE_SYNTAX_KEYS = new Set([
  "equals",
  "not",
  "in",
  "notIn",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "startsWith",
  "endsWith",
  "some",
  "every",
  "none",
  "mode",
]);

/**
 * Names of JSON properties on the **root** schema that appear at the outer layer of `where`,
 * without descending into relational filter objects (`some` / nested value shapes).
 *
 * Used with `select` so properties only mentioned in `where` (e.g. `amenities`) are preserved
 * in the normalized schema, allowing downstream SPARQL CONSTRUCT generators to attach `where`
 * clauses for those properties.
 *
 * Intended for `depth === 0` only; nested normalization passes an empty hint set.
 */
export function referencedRootWhereFilterProperties(
  where: unknown,
  allowedPropertyKeys: ReadonlySet<string>,
): Set<string> {
  const found = new Set<string>();

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      if (key === "AND" || key === "OR") {
        const branches = Array.isArray(val) ? val : [val];
        for (const branch of branches) {
          walk(branch);
        }
      } else if (key === "NOT") {
        const branches = Array.isArray(val) ? val : [val];
        for (const branch of branches) {
          walk(branch);
        }
      } else if (WHERE_SYNTAX_KEYS.has(key)) {
        continue;
      } else if (allowedPropertyKeys.has(key)) {
        found.add(key);
      }
    }
  };

  walk(where);
  return found;
}

/**
 * Recursively filters JSON-LD metadata properties from a nested schema
 * @param schema The nested schema to filter
 * @param excludeJsonLd Whether to exclude @ properties
 * @returns Filtered schema
 */
function filterJsonLdFromNestedSchema(
  schema: JSONSchema7,
  excludeJsonLd: boolean,
): JSONSchema7 {
  if (!excludeJsonLd || !schema.properties) {
    return schema;
  }

  const newProperties: Record<string, JSONSchema7> = {};

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // Skip @ properties
    if (propName.startsWith("@")) {
      continue;
    }

    let processedSchema = propSchema as JSONSchema7;

    // Recursively filter nested objects
    if (processedSchema.type === "object" && processedSchema.properties) {
      processedSchema = filterJsonLdFromNestedSchema(
        processedSchema,
        excludeJsonLd,
      );
    }

    // Recursively filter array items
    if (processedSchema.type === "array" && processedSchema.items) {
      const items = Array.isArray(processedSchema.items)
        ? processedSchema.items[0]
        : processedSchema.items;
      if (
        typeof items === "object" &&
        !Array.isArray(items) &&
        items.type === "object" &&
        items.properties
      ) {
        const filteredItems = filterJsonLdFromNestedSchema(
          items as JSONSchema7,
          excludeJsonLd,
        );
        processedSchema = {
          ...processedSchema,
          items: filteredItems,
        };
      }
    }

    newProperties[propName] = processedSchema;
  }

  return {
    ...schema,
    properties: newProperties,
  };
}

/**
 * Checks if a property should be included based on filter options
 * @template T - The type to derive filter patterns from
 * @param propertyName The name of the property
 * @param propSchema The property schema
 * @param filterOptions The filter options to apply
 * @param rootWhereHints Property names referenced at the root entity in `filterOptions.where` (depth 0 only)
 * @returns Object with inclusion status and pagination options
 */
export function shouldIncludeProperty<T = any>(
  propertyName: string,
  propSchema: JSONSchema7,
  filterOptions: GraphTraversalFilterOptions<T>,
  rootWhereHints: ReadonlySet<string> = new Set<string>(),
): { include: boolean; pagination?: PaginationOptions } {
  const {
    select,
    include,
    omit,
    includeRelationsByDefault = false,
  } = filterOptions;

  // Special properties are always included
  if (propertyName === "@id" || propertyName === "@type") {
    return { include: true };
  }

  // Check omit list first
  if (omit && (omit as any).includes(propertyName)) {
    return { include: false };
  }

  // Root `where` always keeps the property so SPARQL filters can bind it
  // (even when includeRelationsByDefault is false / Prisma-like).
  if (rootWhereHints.has(propertyName)) {
    return { include: true };
  }

  // If select is specified, only include selected properties — plus any root-only `where`
  // refs so query builders still see relational filters (amenities.some, …).
  if (select) {
    const isSelected = select[propertyName] === true;
    return { include: isSelected };
  }

  // Determine if this is a relationship by checking the schema
  // For arrays, check if the items are relationships
  let isRelationship = false;
  if (propSchema.type === "array" && propSchema.items) {
    const items = Array.isArray(propSchema.items)
      ? propSchema.items[0]
      : propSchema.items;
    if (typeof items === "object" && !Array.isArray(items)) {
      isRelationship = isRelationshipSchema(items as JSONSchema7);
    }
  } else {
    isRelationship = isRelationshipSchema(propSchema);
  }

  // Check include pattern (for both relationships and arrays with pagination)
  if (include && propertyName in include) {
    const includeValue = include[propertyName];

    // If it's a boolean
    if (typeof includeValue === "boolean") {
      // For relationships, respect the boolean value
      if (isRelationship) {
        return { include: includeValue };
      }
      // For non-relationships, boolean true means include
      return { include: includeValue };
    }

    // If it's an object with pagination (for arrays)
    if (typeof includeValue === "object") {
      return {
        include: true,
        pagination: {
          take: includeValue.take,
          skip: includeValue.skip,
          orderBy: includeValue.orderBy, // Include orderBy for pagination
        },
      };
    }
  }

  // For relationships not in include pattern
  if (isRelationship) {
    // Use default behavior for relationships not in include
    return { include: includeRelationsByDefault };
  }

  // For non-relationships, include by default unless select is specified
  return { include: true };
}

/**
 * Recursively applies nested filter options to a schema
 * This handles nested includes by recursively applying filters
 * @template T - The type to derive filter patterns from
 * @param schema The schema to filter
 * @param nestedFilterOptions The nested filter options (with nested includes)
 * @param rootSchema The root schema for resolving any remaining refs
 * @param depth Current recursion depth
 * @returns A new schema with nested filters applied
 */
function applyNestedFilters<T = any>(
  schema: JSONSchema7,
  nestedFilterOptions: GraphTraversalFilterOptions<T>,
  rootSchema: JSONSchema7,
  depth: number,
): JSONSchema7 {
  if (!schema.properties || depth > 50) {
    return schema;
  }

  // Apply filters with the nested include pattern
  return applyFilters(schema, nestedFilterOptions, rootSchema, depth + 1);
}

/**
 * Collect property names referenced by Prisma-style `orderBy` so CONSTRUCT /
 * extraction always materialize sort keys (needed for extraction-stage pagination).
 */
export function orderByPropertyKeys(
  orderBy: PaginationOptions["orderBy"],
): string[] {
  if (!orderBy) return [];
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  const keys: string[] = [];
  for (const clause of clauses) {
    if (clause && typeof clause === "object") {
      const record = clause as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        if (record[key]) keys.push(key);
      }
    }
  }
  return keys;
}

/**
 * Merge `orderBy` property keys into a nested `select` so sort fields are not
 * dropped when the caller projects a subset of columns.
 */
function mergeOrderByIntoSelect<T>(
  includeValue: unknown,
): GraphTraversalFilterOptions<T>["select"] | undefined {
  if (typeof includeValue !== "object" || includeValue === null) {
    return undefined;
  }
  const nested = includeValue as {
    select?: Record<string, boolean>;
    orderBy?: PaginationOptions["orderBy"];
  };
  const orderKeys = orderByPropertyKeys(nested.orderBy);
  if (!nested.select && orderKeys.length === 0) {
    return undefined;
  }
  if (!nested.select) {
    // No select — full scalar projection; orderBy keys already present.
    return undefined;
  }
  const merged = { ...nested.select };
  for (const key of orderKeys) {
    merged[key] = true;
  }
  return merged as GraphTraversalFilterOptions<T>["select"];
}

/**
 * Applies filter options to a schema's properties
 * @template T - The type to derive filter patterns from
 * @param schema The schema to filter
 * @param filterOptions The filter options to apply
 * @param rootSchema The root schema for resolving refs in nested filters
 * @param depth Current recursion depth for nested filtering
 * @returns A new schema with filtered properties
 *
 */
export function applyFilters<T = any>(
  schema: JSONSchema7,
  filterOptions: GraphTraversalFilterOptions<T>,
  rootSchema?: JSONSchema7,
  depth: number = 0,
): JSONSchema7 {
  if (!schema.properties) {
    return schema;
  }

  if (filterOptions.where && filterOptions.filterValidationMode) {
    validateFilter(
      filterOptions.where,
      schema,
      filterOptions.filterValidationMode,
    );
  }

  const newSchema: JSONSchema7 = { ...schema };
  const newProperties: Record<string, JSONSchema7> = {};

  // Default: exclude JSON-LD metadata properties (@id, @type, @context, etc.)
  const excludeJsonLdMetadata = filterOptions.excludeJsonLdMetadata !== false;

  const allowedKeys = new Set(
    Object.keys(schema.properties!).filter(
      (p) => !excludeJsonLdMetadata || !p.startsWith("@"),
    ),
  );
  const rootWhereHints =
    depth === 0 && filterOptions.where != null
      ? referencedRootWhereFilterProperties(filterOptions.where, allowedKeys)
      : new Set<string>();

  // Process each property
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // Skip JSON-LD metadata properties if flag is true (default)
    if (excludeJsonLdMetadata && propName.startsWith("@")) {
      continue;
    }

    if (typeof propSchema === "boolean") {
      // Skip boolean schemas
      continue;
    }

    const { include, pagination } = shouldIncludeProperty(
      propName,
      propSchema as JSONSchema7,
      filterOptions,
      rootWhereHints,
    );

    if (include) {
      let processedSchema = propSchema as JSONSchema7;

      // Extract nested include pattern if present
      const includeValue = filterOptions.include?.[propName];
      const nestedInclude =
        typeof includeValue === "object" && includeValue !== null
          ? includeValue.include
          : undefined;
      const nestedSelect =
        typeof includeValue === "object" && includeValue !== null
          ? (mergeOrderByIntoSelect(includeValue) ?? includeValue.select)
          : undefined;
      const nestedOmit =
        typeof includeValue === "object" && includeValue !== null
          ? includeValue.omit
          : undefined;
      const nestedWhere =
        typeof includeValue === "object" && includeValue !== null
          ? includeValue.where
          : undefined;
      const nestedMaxRecursion =
        typeof includeValue === "object" &&
        includeValue !== null &&
        typeof (includeValue as { maxRecursion?: number }).maxRecursion ===
          "number"
          ? (includeValue as { maxRecursion: number }).maxRecursion
          : undefined;

      // Note: pagination is extracted but NOT added to schema
      // It will be passed through context during extraction/query building

      const hasNestedFilterOptions =
        nestedInclude != null ||
        nestedSelect != null ||
        nestedOmit != null ||
        nestedWhere != null ||
        nestedMaxRecursion !== undefined;

      const nestedFilterPayload = {
        ...filterOptions,
        include: nestedInclude,
        select: nestedSelect,
        omit: nestedOmit,
        where: nestedWhere,
        // Branch maxRecursion: 0 → stub relations of related entity
        ...(nestedMaxRecursion === 0
          ? { includeRelationsByDefault: false }
          : {}),
      } as GraphTraversalFilterOptions<T>;

      // Recursively filter @ properties from nested objects
      if (
        excludeJsonLdMetadata &&
        processedSchema.type === "object" &&
        processedSchema.properties
      ) {
        processedSchema = filterJsonLdFromNestedSchema(
          processedSchema,
          excludeJsonLdMetadata,
        );

        // Apply nested filters if present (recursively)
        if (
          hasNestedFilterOptions &&
          processedSchema.properties &&
          rootSchema
        ) {
          processedSchema = applyNestedFilters(
            processedSchema,
            nestedFilterPayload,
            rootSchema,
            depth,
          );
        }
      }

      // Recursively filter @ properties from array items
      if (
        excludeJsonLdMetadata &&
        processedSchema.type === "array" &&
        processedSchema.items
      ) {
        const items = Array.isArray(processedSchema.items)
          ? processedSchema.items[0]
          : processedSchema.items;
        if (
          typeof items === "object" &&
          !Array.isArray(items) &&
          items.type === "object" &&
          items.properties
        ) {
          let filteredItems = filterJsonLdFromNestedSchema(
            items as JSONSchema7,
            excludeJsonLdMetadata,
          );

          // Apply nested filters to array items if present (recursively)
          if (
            hasNestedFilterOptions &&
            filteredItems.properties &&
            rootSchema
          ) {
            filteredItems = applyNestedFilters(
              filteredItems,
              nestedFilterPayload,
              rootSchema,
              depth,
            );
          }

          // maxRecursion: 0 → keep only identity on related entities
          if (nestedMaxRecursion === 0 && filteredItems.properties) {
            const stubProps: Record<string, JSONSchema7> = {};
            if (filteredItems.properties["@id"]) {
              stubProps["@id"] = filteredItems.properties["@id"] as JSONSchema7;
            }
            // Keep orderBy scalars so extraction-stage sort still works
            for (const key of orderByPropertyKeys(
              typeof includeValue === "object" && includeValue !== null
                ? (includeValue as PaginationOptions).orderBy
                : undefined,
            )) {
              if (filteredItems.properties[key]) {
                stubProps[key] = filteredItems.properties[key] as JSONSchema7;
              }
            }
            if (Object.keys(stubProps).length > 0) {
              filteredItems = {
                ...filteredItems,
                properties: stubProps,
                required: filteredItems.required?.filter((r) => r in stubProps),
              };
            }
          }

          processedSchema = {
            ...processedSchema,
            items: filteredItems,
          };
        }
      }

      newProperties[propName] = processedSchema;
    }
  }

  newSchema.properties = newProperties;

  // Update required array to only include properties that still exist
  if (schema.required) {
    newSchema.required = schema.required.filter(
      (prop) => prop in newProperties,
    );
  }

  return newSchema;
}

/**
 * Extracts pagination options for a specific property from include pattern
 * @template T - The type to derive filter patterns from
 * @param propertyName The property name
 * @param include The include pattern
 * @returns Pagination options if specified
 */
export function extractPaginationOptions<T = any>(
  propertyName: string,
  include?: IncludePattern<T>,
): PaginationOptions | undefined {
  if (!include || !(propertyName in include)) {
    return undefined;
  }

  const includeValue = include[propertyName];

  if (typeof includeValue === "object" && includeValue !== null) {
    return {
      take: includeValue.take,
      skip: includeValue.skip,
      orderBy: includeValue.orderBy, // Include orderBy for pagination
    };
  }

  return undefined;
}
