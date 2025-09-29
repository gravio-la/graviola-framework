import { JSONSchema7 } from "json-schema";
import { set } from "lodash-es";
import { walkJSONSchema } from "./walkJSONSchema";
import { defs } from "./jsonSchema";

export interface TranslationGenerationOptions {
  /**
   * Function to generate default title translations
   * @param key - The property key
   * @param path - The path to the property as an array
   * @param schema - The schema object for this property
   * @returns The default title translation
   */
  defaultTitleTranslation?: (
    key: string,
    path: string[],
    schema: JSONSchema7,
  ) => string;

  /**
   * Function to generate default description translations
   * @param key - The property key
   * @param path - The path to the property as an array
   * @param schema - The schema object for this property
   * @returns The default description translation
   */
  defaultDescriptionTranslation?: (
    key: string,
    path: string[],
    schema: JSONSchema7,
  ) => string;

  /**
   * Whether to include description translations with _description suffix
   * @default false
   */
  includeDescription?: boolean;
}

export interface TranslationObject {
  [key: string]: string | TranslationObject;
}

/**
 * Default function to generate title translations
 */
const defaultTitleTranslationFn = (
  key: string,
  path: string[],
  schema: JSONSchema7,
): string => {
  return schema.title || key;
};

/**
 * Default function to generate description translations
 */
const defaultDescriptionTranslationFn = (
  key: string,
  path: string[],
  schema: JSONSchema7,
): string => {
  return schema.description || "";
};

/**
 * Generates translation keys from a JSON Schema for i18n usage
 *
 * @param schema - The JSON Schema to extract translation keys from
 * @param options - Configuration options for translation generation
 * @returns A nested object with translation keys and default values
 */
export function extractTranslationKeysFromSchema(
  schema: JSONSchema7,
  options: TranslationGenerationOptions = {},
): TranslationObject {
  const {
    defaultTitleTranslation = defaultTitleTranslationFn,
    defaultDescriptionTranslation = defaultDescriptionTranslationFn,
    includeDescription = false,
  } = options;

  const translations: TranslationObject = {};
  const definitions = defs(schema);

  // Process each definition in the schema
  Object.entries(definitions).forEach(([defName, defSchema]) => {
    if (typeof defSchema === "object" && defSchema !== null) {
      const defTranslations: TranslationObject = {};

      // Walk through the definition schema
      walkJSONSchema(defSchema as JSONSchema7, {
        callbacks: {
          onEnterProperty: (property, propSchema, path) => {
            // Skip "items" properties as they are schema constructs, not actual data properties
            if (property === "items") {
              return true;
            }

            // Create title translation - use the path excluding the last element for nesting
            const titleKey = property;
            const titleValue = defaultTitleTranslation(
              property,
              path,
              propSchema,
            );
            const nestingPath = path.slice(0, -1).filter((p) => p !== "items");
            set(defTranslations, [...nestingPath, titleKey], titleValue);

            // Create description translation if enabled
            if (includeDescription) {
              const descKey = `${property}_description`;
              const descValue = defaultDescriptionTranslation(
                property,
                path,
                propSchema,
              );
              set(defTranslations, [...nestingPath, descKey], descValue);
            }

            return true; // Continue walking
          },
          onObject: (objSchema, path) => {
            // Add title for the object itself if it's a nested object, but skip "items" objects
            if (path.length > 0) {
              const objectKey = path[path.length - 1];
              if (objectKey !== "items") {
                const objectTitleKey = `${objectKey}_title`;
                const objectTitleValue = defaultTitleTranslation(
                  objectKey,
                  path,
                  objSchema,
                );
                const nestingPath = path
                  .slice(0, -1)
                  .filter((p) => p !== "items");
                set(
                  defTranslations,
                  [...nestingPath, objectTitleKey],
                  objectTitleValue,
                );

                if (includeDescription) {
                  const objectDescKey = `${objectKey}_description`;
                  const objectDescValue = defaultDescriptionTranslation(
                    objectKey,
                    path,
                    objSchema,
                  );
                  set(
                    defTranslations,
                    [...nestingPath, objectDescKey],
                    objectDescValue,
                  );
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
                const arrayTitleKey = `${arrayKey}_title`;
                const arrayTitleValue = defaultTitleTranslation(
                  arrayKey,
                  path,
                  arraySchema,
                );
                const nestingPath = path
                  .slice(0, -1)
                  .filter((p) => p !== "items");
                set(
                  defTranslations,
                  [...nestingPath, arrayTitleKey],
                  arrayTitleValue,
                );

                if (includeDescription) {
                  const arrayDescKey = `${arrayKey}_description`;
                  const arrayDescValue = defaultDescriptionTranslation(
                    arrayKey,
                    path,
                    arraySchema,
                  );
                  set(
                    defTranslations,
                    [...nestingPath, arrayDescKey],
                    arrayDescValue,
                  );
                }
              }
            }
            return true;
          },
        },
      });

      // Add definition-level translations
      const defTitleKey = `${defName}_title`;
      const defDescKey = `${defName}_description`;

      defTranslations[defTitleKey] = defaultTitleTranslation(
        defName,
        [defName],
        defSchema as JSONSchema7,
      );

      if (includeDescription) {
        defTranslations[defDescKey] = defaultDescriptionTranslation(
          defName,
          [defName],
          defSchema as JSONSchema7,
        );
      }

      translations[defName] = defTranslations;
    }
  });

  // Process root schema if it has properties
  if (schema.properties || schema.type === "object") {
    const rootTranslations: TranslationObject = {};

    walkJSONSchema(schema, {
      callbacks: {
        onEnterProperty: (property, propSchema, path) => {
          // Skip if this property is part of a definition (already processed above)
          if (path.length > 0 && definitions[path[0]]) {
            return true;
          }

          // Skip "items" properties as they are schema constructs, not actual data properties
          if (property === "items") {
            return true;
          }

          // Create title translation
          const titleKey = property;
          const titleValue = defaultTitleTranslation(
            property,
            path,
            propSchema,
          );
          const nestingPath = path.slice(0, -1).filter((p) => p !== "items");
          set(rootTranslations, [...nestingPath, titleKey], titleValue);

          // Create description translation if enabled
          if (includeDescription) {
            const descKey = `${property}_description`;
            const descValue = defaultDescriptionTranslation(
              property,
              path,
              propSchema,
            );
            set(rootTranslations, [...nestingPath, descKey], descValue);
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
            const objectTitleKey = `${objectKey}_title`;
            const objectTitleValue = defaultTitleTranslation(
              objectKey,
              path,
              objSchema,
            );
            const nestingPath = path.slice(0, -1).filter((p) => p !== "items");
            set(
              rootTranslations,
              [...nestingPath, objectTitleKey],
              objectTitleValue,
            );

            if (includeDescription) {
              const objectDescKey = `${objectKey}_description`;
              const objectDescValue = defaultDescriptionTranslation(
                objectKey,
                path,
                objSchema,
              );
              set(
                rootTranslations,
                [...nestingPath, objectDescKey],
                objectDescValue,
              );
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
              const arrayTitleKey = `${arrayKey}_title`;
              const arrayTitleValue = defaultTitleTranslation(
                arrayKey,
                path,
                arraySchema,
              );
              const nestingPath = path
                .slice(0, -1)
                .filter((p) => p !== "items");
              set(
                rootTranslations,
                [...nestingPath, arrayTitleKey],
                arrayTitleValue,
              );

              if (includeDescription) {
                const arrayDescKey = `${arrayKey}_description`;
                const arrayDescValue = defaultDescriptionTranslation(
                  arrayKey,
                  path,
                  arraySchema,
                );
                set(
                  rootTranslations,
                  [...nestingPath, arrayDescKey],
                  arrayDescValue,
                );
              }
            }
          }

          return true;
        },
      },
    });

    // Add root schema translations if there are any properties
    if (Object.keys(rootTranslations).length > 0) {
      // Add root-level title and description
      rootTranslations["_title"] = defaultTitleTranslation("root", [], schema);

      if (includeDescription) {
        rootTranslations["_description"] = defaultDescriptionTranslation(
          "root",
          [],
          schema,
        );
      }

      // Merge root translations with the main translations object
      Object.assign(translations, rootTranslations);
    }
  }

  return translations;
}
