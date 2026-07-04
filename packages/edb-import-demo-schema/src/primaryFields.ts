import {
  PrimaryField,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import { defs } from "@graviola/json-schema-utils";
import { schema } from "./schema";

const defaultMapping: PrimaryField = {
  label: "title",
  description: "description",
};

const defaultMappingWithImg: PrimaryField = {
  label: "title",
  description: "description",
  image: "image",
};

export const primaryFields: Partial<PrimaryFieldDeclaration<string>> = {
  ...Object.fromEntries(
    Object.keys(defs(schema)).map((key) => [key, defaultMapping]),
  ),
  Exhibition: defaultMappingWithImg,
  Person: {
    ...defaultMappingWithImg,
    label: "name",
  },
  Corporation: {
    ...defaultMapping,
    label: "name",
  },
  Place: defaultMappingWithImg,
  Location: defaultMappingWithImg,
  Occupation: defaultMapping,
};
