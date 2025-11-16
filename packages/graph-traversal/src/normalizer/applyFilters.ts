import type { JSONSchema7 } from "json-schema";
import type {
  GraphTraversalFilterOptions,
  IncludePattern,
  SelectPattern,
  OmitPattern,
  PaginationOptions,
} from "@graviola/edb-core-types";
import type { PropertyMetadata } from "./types";

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
 * @param propertyName The name of the property
 * @param metadata Metadata about the property
 * @param filterOptions The filter options to apply
 * @returns Object with inclusion status and pagination options
 */
export function shouldIncludeProperty(
  propertyName: string,
  metadata: PropertyMetadata,
  filterOptions: GraphTraversalFilterOptions,
): { include: boolean; pagination?: PaginationOptions } {
  const {
    select,
    include,
    omit,
    includeRelationsByDefault = true,
  } = filterOptions;

  // Special properties are always included
  if (propertyName === "@id" || propertyName === "@type") {
    return { include: true };
  }

  // Check omit list first
  if (omit && omit.includes(propertyName as any)) {
    return { include: false };
  }

  // If select is specified, only include selected properties
  if (select) {
    const isSelected = select[propertyName] === true;
    return { include: isSelected };
  }

  // Check include pattern (for both relationships and arrays with pagination)
  if (include && propertyName in include) {
    const includeValue = include[propertyName];

    // If it's a boolean
    if (typeof includeValue === "boolean") {
      // For relationships, respect the boolean value
      if (metadata.isRelationship) {
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
  if (metadata.isRelationship) {
    // Use default behavior for relationships not in include
    return { include: includeRelationsByDefault };
  }

  // For non-relationships, include by default unless select is specified
  return { include: true };
}

/**
 * Applies filter options to a schema's properties
 * @param schema The schema to filter
 * @param propertyMetadata Metadata about each property
 * @param filterOptions The filter options to apply
 * @returns A new schema with filtered properties
 */
export function applyFilters(
  schema: JSONSchema7,
  propertyMetadata: Record<string, PropertyMetadata>,
  filterOptions: GraphTraversalFilterOptions,
): JSONSchema7 {
  if (!schema.properties) {
    return schema;
  }

  const newSchema: JSONSchema7 = { ...schema };
  const newProperties: Record<string, JSONSchema7> = {};

  // Default: exclude JSON-LD metadata properties (@id, @type, @context, etc.)
  const excludeJsonLdMetadata = filterOptions.excludeJsonLdMetadata !== false;

  // Process each property
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // Skip JSON-LD metadata properties if flag is true (default)
    if (excludeJsonLdMetadata && propName.startsWith("@")) {
      continue;
    }

    const metadata = propertyMetadata[propName];

    if (!metadata) {
      // If we don't have metadata, include by default
      newProperties[propName] = propSchema as JSONSchema7;
      continue;
    }

    const { include, pagination } = shouldIncludeProperty(
      propName,
      metadata,
      filterOptions,
    );

    if (include) {
      let processedSchema = propSchema as JSONSchema7;

      // Apply pagination metadata if applicable
      if (pagination && metadata.isArray) {
        processedSchema = {
          ...processedSchema,
          "x-pagination": pagination,
        } as JSONSchema7;
      }

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
          const filteredItems = filterJsonLdFromNestedSchema(
            items as JSONSchema7,
            excludeJsonLdMetadata,
          );
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
 * @param propertyName The property name
 * @param include The include pattern
 * @returns Pagination options if specified
 */
export function extractPaginationOptions(
  propertyName: string,
  include?: IncludePattern,
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
