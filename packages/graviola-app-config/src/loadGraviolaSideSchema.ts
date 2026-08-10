import Ajv from "ajv";
import type { GraviolaSideSchema } from "./types";
import { graviolaSideSchemaDefinition } from "./sideSchemaDefinition";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(graviolaSideSchemaDefinition);

/**
 * Parse and validate a `.gra.side-schema.json` document.
 * Throws with AJV error text when the document is invalid.
 */
export function loadGraviolaSideSchema(data: unknown): GraviolaSideSchema {
  if (!validate(data)) {
    throw new Error(
      `Invalid Graviola side-schema: ${ajv.errorsText(validate.errors)}`,
    );
  }
  return data as GraviolaSideSchema;
}
