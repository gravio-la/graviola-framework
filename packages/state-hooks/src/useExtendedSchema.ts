import { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import {
  bringDefinitionToTop,
  prepareStubbedSchema,
} from "@graviola/json-schema-utils";
import type { StringToIRIFn } from "@graviola/edb-core-types";
import { useAdbContext } from "./provider";

type UseExtendedSchemaProps = {
  typeName?: string;
};
const defaultMakeStubSchema = (
  schema: JSONSchema7,
  typeNameToTypeIRI: StringToIRIFn,
) => {
  return prepareStubbedSchema(
    schema,
    (modelName) => ({
      "@type": {
        const: typeNameToTypeIRI(modelName.replace(/Stub$/, "")),
        type: "string",
      },
      "@id": {
        type: "string",
      },
    }),
    () => ["@id"],
  );
};

/**
 * This hook is used to get the JSONLD extended schema for a given type name.
 *
 * By default, it creates Stub schema-definition for each type in the schema. The stub definition
 * lacks all relations, to avoid infinite recursion when rendering the schema.
 * It also adds the @type and @id properties to the schema.
 *
 * An alternative extension method can be provided to the app context, which will be used instead of the default one
 * if present.
 *
 * It brings the definition of the given typeName to the top of the schema.
 *
 * @param typeName Definition of the type to be extended
 */
export const useExtendedSchema = ({ typeName }: UseExtendedSchemaProps) => {
  const { schema, typeNameToTypeIRI, makeStubSchema } = useAdbContext();
  return useMemo(() => {
    if (!typeName) return undefined;
    const defaultFn = (schema: JSONSchema7) =>
      defaultMakeStubSchema(schema, typeNameToTypeIRI);
    const prepareSchema = makeStubSchema || defaultFn;
    return bringDefinitionToTop(prepareSchema(schema), typeName);
  }, [typeName, schema, makeStubSchema, typeNameToTypeIRI]);
};
