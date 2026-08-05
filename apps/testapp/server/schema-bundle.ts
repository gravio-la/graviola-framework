/**
 * Schema bundle for the REST sample server — same item schema the UI uses.
 * Kept free of React so Bun can load it as a plain server module.
 */
import type { JSONSchema7 } from "json-schema";

import { schema as itemSchema } from "../src/item-schema.ts";
import { exampleDataTurtle } from "../src/item-fixture.ts";

export const schema = itemSchema as JSONSchema7;

export const defaultPrefix = "http://www.example.org/";

export const primaryFields = {
  Category: {
    label: "name",
    description: "description",
    image: "image",
  },
  Item: {
    label: "name",
    description: "description",
    image: "photos",
  },
  Tag: {
    label: "name",
    description: "description",
    image: "image",
  },
  Vendor: {
    label: "name",
    description: "description",
    image: "logo",
  },
};

export const typeNameToTypeIRI = (typeName: string) =>
  `${defaultPrefix}${typeName}`;

export const typeIRItoTypeName = (iri: string) =>
  iri.startsWith(defaultPrefix) ? iri.slice(defaultPrefix.length) : iri;

export const jsonldContext = { "@vocab": defaultPrefix };

export { exampleDataTurtle };

export default {
  schema,
  primaryFields,
  defaultPrefix,
  typeNameToTypeIRI,
  typeIRItoTypeName,
  jsonldContext,
  initialData: exampleDataTurtle,
};
