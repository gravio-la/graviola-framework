import { JSONSchema7 } from "json-schema";
import { walkJSONSchema, defs } from "@graviola/json-schema-utils";

/**
 * Type for i18next translation function
 */
type TFunction = (key: string) => string;

/**
 * Type for i18next exists function
 */
type ExistsFunction = (key: string) => boolean;

/**
 * Creates a deep clone of a JSON Schema object
 */
function deepCloneSchema(schema: JSONSchema7): JSONSchema7 {
  return JSON.parse(JSON.stringify(schema));
}

/**
 * Builds a translation key path from an array of path segments
 */
function buildTranslationKey(basePath: string[], property: string): string {
  return [...basePath, property].join(".");
}

/**
 * Translates a JSON Schema by replacing title and description properties with translated values
 * when translations exist in the provided i18next functions.
 *
 * Uses the same traversal logic as extractTranslationKeysFromSchema to ensure consistency
 * between translation key generation and consumption.
 *
 * @param schema - The JSON Schema to translate
 * @param t - i18next translation function
 * @param exists - i18next exists function to check if translation keys exist
 * @returns A new JSON Schema with translated titles and descriptions
 */
export function translateJsonSchema(
  schema: JSONSchema7,
  t: TFunction,
  exists: ExistsFunction,
): JSONSchema7 {
  // Create a deep clone to avoid mutating the original schema
  const translatedSchema = deepCloneSchema(schema);
  const definitions = defs(translatedSchema);

  // Process each definition in the schema
  Object.entries(definitions).forEach(([defName, defSchema]) => {
    if (typeof defSchema === "object" && defSchema !== null) {
      const defSchemaObj = defSchema as JSONSchema7;

      // Walk through the definition schema
      walkJSONSchema(defSchemaObj, {
        callbacks: {
          onEnterProperty: (property, propSchema, path) => {
            // Skip "items" properties as they are schema constructs
            if (property === "items") {
              return true;
            }

            // Build translation key path (filtering out "items")
            const cleanPath = path.slice(0, -1).filter((p) => p !== "items");
            const translationKey = buildTranslationKey(
              [defName, ...cleanPath],
              property,
            );
            const descriptionKey = buildTranslationKey(
              [defName, ...cleanPath],
              `${property}_description`,
            );

            // Translate title if translation exists
            if (exists(translationKey)) {
              propSchema.title = t(translationKey);
            }

            // Translate description if translation exists
            if (exists(descriptionKey)) {
              propSchema.description = t(descriptionKey);
            }

            return true;
          },
          onObject: (objSchema, path) => {
            // Add title for the object itself if it's a nested object, but skip "items" objects
            if (path.length > 0) {
              const objectKey = path[path.length - 1];
              if (objectKey !== "items") {
                const cleanPath = path
                  .slice(0, -1)
                  .filter((p) => p !== "items");
                const titleKey = buildTranslationKey(
                  [defName, ...cleanPath],
                  `${objectKey}_title`,
                );
                const descriptionKey = buildTranslationKey(
                  [defName, ...cleanPath],
                  `${objectKey}_description`,
                );

                if (exists(titleKey)) {
                  objSchema.title = t(titleKey);
                }

                if (exists(descriptionKey)) {
                  objSchema.description = t(descriptionKey);
                }
              }
            }
            return true;
          },
          onArray: (arraySchema, path) => {
            // Add title for the array itself if it's a nested array, but skip "items" arrays
            if (path.length > 0) {
              const arrayKey = path[path.length - 1];
              if (arrayKey !== "items") {
                const cleanPath = path
                  .slice(0, -1)
                  .filter((p) => p !== "items");
                const titleKey = buildTranslationKey(
                  [defName, ...cleanPath],
                  `${arrayKey}_title`,
                );
                const descriptionKey = buildTranslationKey(
                  [defName, ...cleanPath],
                  `${arrayKey}_description`,
                );

                if (exists(titleKey)) {
                  arraySchema.title = t(titleKey);
                }

                if (exists(descriptionKey)) {
                  arraySchema.description = t(descriptionKey);
                }
              }
            }
            return true;
          },
        },
      });

      // Add definition-level translations
      const defTitleKey = `${defName}_title`;
      const defDescriptionKey = `${defName}_description`;

      if (exists(defTitleKey)) {
        defSchemaObj.title = t(defTitleKey);
      }

      if (exists(defDescriptionKey)) {
        defSchemaObj.description = t(defDescriptionKey);
      }
    }
  });

  // Process root schema if it has properties
  if (translatedSchema.properties || translatedSchema.type === "object") {
    walkJSONSchema(translatedSchema, {
      callbacks: {
        onEnterProperty: (property, propSchema, path) => {
          // Skip if this property is part of a definition (already processed above)
          if (path.length > 0 && definitions[path[0]]) {
            return true;
          }

          // Skip "items" properties as they are schema constructs
          if (property === "items") {
            return true;
          }

          // Build translation key path (filtering out "items")
          const cleanPath = path.slice(0, -1).filter((p) => p !== "items");
          const translationKey = buildTranslationKey(cleanPath, property);
          const descriptionKey = buildTranslationKey(
            cleanPath,
            `${property}_description`,
          );

          // Translate title if translation exists
          if (exists(translationKey)) {
            propSchema.title = t(translationKey);
          }

          // Translate description if translation exists
          if (exists(descriptionKey)) {
            propSchema.description = t(descriptionKey);
          }

          return true;
        },
        onObject: (objSchema, path) => {
          // Skip root object and definition objects
          if (path.length === 0 || (path.length > 0 && definitions[path[0]])) {
            return true;
          }

          // Add title for nested objects, but skip "items" objects
          const objectKey = path[path.length - 1];
          if (objectKey !== "items") {
            const cleanPath = path.slice(0, -1).filter((p) => p !== "items");
            const titleKey = buildTranslationKey(
              cleanPath,
              `${objectKey}_title`,
            );
            const descriptionKey = buildTranslationKey(
              cleanPath,
              `${objectKey}_description`,
            );

            if (exists(titleKey)) {
              objSchema.title = t(titleKey);
            }

            if (exists(descriptionKey)) {
              objSchema.description = t(descriptionKey);
            }
          }

          return true;
        },
        onArray: (arraySchema, path) => {
          // Skip arrays in definition objects
          if (path.length > 0 && definitions[path[0]]) {
            return true;
          }

          // Add title for arrays, but skip "items" arrays
          if (path.length > 0) {
            const arrayKey = path[path.length - 1];
            if (arrayKey !== "items") {
              const cleanPath = path.slice(0, -1).filter((p) => p !== "items");
              const titleKey = buildTranslationKey(
                cleanPath,
                `${arrayKey}_title`,
              );
              const descriptionKey = buildTranslationKey(
                cleanPath,
                `${arrayKey}_description`,
              );

              if (exists(titleKey)) {
                arraySchema.title = t(titleKey);
              }

              if (exists(descriptionKey)) {
                arraySchema.description = t(descriptionKey);
              }
            }
          }

          return true;
        },
      },
    });

    // Add root-level title and description if there are properties
    if (Object.keys(translatedSchema.properties || {}).length > 0) {
      const rootTitleKey = "_title";
      const rootDescriptionKey = "_description";

      if (exists(rootTitleKey)) {
        translatedSchema.title = t(rootTitleKey);
      }

      if (exists(rootDescriptionKey)) {
        translatedSchema.description = t(rootDescriptionKey);
      }
    }
  }

  return translatedSchema;
}
