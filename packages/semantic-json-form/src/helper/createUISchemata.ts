import { JsonFormsUISchemaRegistryEntry, UISchemaElement } from "@jsonforms/core";

import {
  defs,
  extractTypeIRI,
  getDefintitionKey,
} from "@graviola/json-schema-utils";
import { JSONSchema7 } from "json-schema";
import { StringToIRIFn } from "@graviola/edb-core-types";

type TypeNameLabelMap = Record<string, string>;
type TypeNameUiSchemaOptionsMap = Record<string, object>;

type CreateUISchemataOptions = {
  rank?: number,
  typeNameLabelMap?: TypeNameLabelMap,
  typeNameUiSchemaOptionsMap?: TypeNameUiSchemaOptionsMap,
  definitionToTypeIRI?: StringToIRIFn,
  makeUiSchemaOptions?: (defs: string) => object,
  excludeDefinitions?: string[],
}

/**
 * Prefer the definition's own `@type.const` (schema is source of truth) over
 * `baseIRI + name`. LinkML-generated models often put classes under
 * `entityBaseIRI` while `baseIRI` stays shorter — a mismatch here makes the
 * stub UISchema registry miss, and MaterialLinkedObjectRenderer falls back to
 * Generate.uiSchema → infinite recursion on self-referential $refs.
 */
function resolveDefinitionTypeIRI(
  definitionSchema: JSONSchema7 | boolean | undefined,
  definitionName: string,
  definitionToTypeIRI?: StringToIRIFn,
): string | undefined {
  if (definitionSchema && typeof definitionSchema !== "boolean") {
    const fromSchema = extractTypeIRI(definitionSchema);
    if (fromSchema) return fromSchema;
  }
  return definitionToTypeIRI?.(definitionName);
}

/**
 * Create a registry of UISchemaElements for all definitions in a schema.
 * 
 * The UISchemaElements are created with a stub layout that includes a control for the "@id" and "@type" properties.
 * The tester for the UISchemaElements checks whether the "@type" property is equal to the IRI of the definition.
 * 
 * This utility function makes it easy to use definitions in a JSON Schema by default as a relationship between entities.
 * Normaly a definition is just resolved to it's schema and treated as a normal object or array without any special handling.
 * 
 * @param schema The schema to create UISchemaElements for.
 * @param options Options for the creation of the UISchemaElements.
 * @param options.rank The rank to assign to the UISchemaElements in the registry. Higher ranks are preferred. Default is 10.
 * @param options.typeNameLabelMap A map from definition names to labels to use for the controls.
 * @param options.typeNameUiSchemaOptionsMap A map from definition names to additional UI schema options.
 * @param options.definitionToTypeIRI A function that converts a definition name to an IRI for the type.
 * @param options.makeUiSchemaOptions A function that creates UI schema options for a definition.
 * @param options.excludeDefinitions An array of definition names to exclude from the registry.
 * @returns A registry of UISchemaElements and a map of UISchemaElements by definition name.
 */
export const createUISchemata = (
  schema: JSONSchema7,
  options?: CreateUISchemataOptions,
): { registry: JsonFormsUISchemaRegistryEntry[], uiSchemata: Record<string, UISchemaElement> } => {

  const {
    rank = 10,
    typeNameLabelMap = {},
    typeNameUiSchemaOptionsMap = {},
    definitionToTypeIRI,
    makeUiSchemaOptions,
    excludeDefinitions = [],
  } = options ?? {};

  const definitionsKey = getDefintitionKey(schema);
  const definitions = defs(schema as JSONSchema7);

  const defaultMakeUiSchemaOptions = (
    definitionName: string,
    typeIRI: string | undefined,
  ) => ({
    inline: true,
    context: {
      $ref: `#/${definitionsKey}/${definitionName}`,
      typeIRI,
    },
    ...(definitionName in typeNameUiSchemaOptionsMap ? typeNameUiSchemaOptionsMap[definitionName] : {}),
  })

  const createStubLayout = (
    definitionName: string,
    typeIRI: string | undefined,
    label?: string,
  ) => ({
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        ...(definitionName in typeNameLabelMap ? { label: typeNameLabelMap[definitionName] } : (label ? { label } : {})),
        options: makeUiSchemaOptions
          ? makeUiSchemaOptions(definitionName)
          : defaultMakeUiSchemaOptions(definitionName, typeIRI),
        scope: "#/properties/@id",
      },
      {
        type: "Control",
        scope: "#/properties/@type"
      },
    ],
  } as UISchemaElement);

  const registry: JsonFormsUISchemaRegistryEntry[] = [];
  const uiSchemata: Record<string, UISchemaElement> = {};
  Object.keys(definitions)
    .filter(definitionName => !excludeDefinitions.includes(definitionName))
    .map((definitionName) => {
      const typeIRI = resolveDefinitionTypeIRI(
        definitions[definitionName],
        definitionName,
        definitionToTypeIRI,
      );
      const element = createStubLayout(definitionName, typeIRI);
      uiSchemata[definitionName] = element;
      registry.push({
        tester: (candidate) => {
          if (!typeIRI) return -1;
          return candidate.properties?.["@type"]?.const === typeIRI ? rank : -1;
        },
        uischema: element,
      });
    });
  return { registry, uiSchemata };
}