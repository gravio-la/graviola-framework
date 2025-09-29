import type { NamedEntityData, WalkerOptions } from "@graviola/edb-core-types";
import { filterUndefOrNull } from "@graviola/edb-core-utils";
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import datasetFactory from "@rdfjs/dataset";
import type { Dataset } from "@rdfjs/types";
import type { JSONSchema7 } from "json-schema";

import { jsonld2DataSet } from "./jsonld2DataSet";

type Uri = string;
type Language = string;
interface IJsonLdContext {
  "@base"?: Uri | null;
  "@vocab"?: Uri | null;
  "@language"?: Language;
  [id: string]: any;
  "@version"?: number;
}
type JsonLdContext = IJsonLdContext | string | (IJsonLdContext | string)[];

type CleanJSONLDOptions = {
  walkerOptions?: Partial<WalkerOptions>;
  jsonldContext?: JsonLdContext;
  defaultPrefix: string;
  keepContext?: boolean;
  removeInverseProperties?: boolean;
};

export const defaultWalkerOptions: Partial<WalkerOptions> = {
  omitEmptyArrays: true,
  omitEmptyObjects: true,
  maxRecursionEachRef: 2,
  maxRecursion: 3,
  skipAtLevel: 3,
  doNotRecurseNamedNodes: true,
};

/**
 * cleans a JSONLD property by removing empty objects and arrays and all reoccuring inner objects that have the same @id
 * @param data - the data to clean
 * @returns
 */
export const cleanProperty = (data: any) => {
  return Array.isArray(data)
    ? filterUndefOrNull(data).map(cleanProperty)
    : typeof data === "object" && data !== null
      ? Object.keys(data).reduce((acc, key) => {
          const prop = data[key];
          if (typeof prop === "object") {
            const cleanedProp = cleanProperty(prop);
            if (Array.isArray(cleanedProp) && prop.length === 0) return acc;
            if (
              !Array.isArray(cleanedProp) &&
              cleanedProp !== null &&
              (Object.keys(cleanedProp).length === 0 ||
                (Object.keys(cleanedProp).length === 1 && cleanedProp["@type"]))
            ) {
              return acc;
            }
            return {
              ...acc,
              [key]: cleanedProp,
            };
          }
          return {
            ...acc,
            [key]: prop,
          };
        }, {})
      : data;
};

/**
 * recurses through a json object/array and removes objects that match the tester function
 *
 * @param data
 * @param tester
 * @returns
 */

export const recursiveFilter = (
  data: any,
  tester: (data: any, level: number) => boolean,
  level: number = 0,
): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => !tester(item, level))
      .map((item) => recursiveFilter(item, tester, level + 1));
  }

  if (typeof data === "object") {
    if (tester(data, level)) {
      return undefined;
    }

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = recursiveFilter(value, tester, level + 1);
      if (cleanedValue !== undefined) {
        result[key] = cleanedValue;
      }
    }
    return result;
  }

  return data;
};

/**
 * removes all properties with an x-inverseOf annotation from a schema
 * @param schema - the schema to remove inverse properties from
 * @returns
 */
export const removeInversePropertiesFromSchema = (schema: JSONSchema7) => {
  if (schema.type === "object" && schema.properties) {
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties)
          .filter(([, value]) => !value["x-inverseOf"])
          .map(([key, value]) => [
            key,
            removeInversePropertiesFromSchema(value as JSONSchema7),
          ]),
      ),
    };
  }
  if (schema.type === "array" && typeof schema.items === "object") {
    return {
      ...schema,
      items: removeInversePropertiesFromSchema(schema.items as JSONSchema7),
    };
  }
  return schema;
};

const prepareSchema = (
  schema: JSONSchema7,
  removeInverseProperties?: boolean,
) => {
  if (removeInverseProperties) {
    return removeInversePropertiesFromSchema(schema);
  }
  return schema;
};

/**
 *
 * cleans a JSONLD document by removing empty objects and arrays and all reoccuring inner objects that have the same @id
 * @param data - the data to clean
 * @param schema
 * @param options
 *  - jsonldContext - the jsonld context to use
 *  - defaultPrefix - the default prefix to use
 *  - walkerOptions - the walker options to use
 *  - keepContext - whether to keep the JSONLD context
 *  - removeInverseProperties - whether to remove inverse properties
 * @returns
 */
export const cleanJSONLD = async (
  data: NamedEntityData,
  schema: JSONSchema7,
  {
    jsonldContext,
    defaultPrefix,
    walkerOptions: walkerOptionsPassed = {},
    keepContext,
    removeInverseProperties,
  }: CleanJSONLDOptions,
) => {
  const entityIRI = data["@id"];
  const walkerOptions = {
    ...defaultWalkerOptions,
    ...walkerOptionsPassed,
  };

  const finalJsonldContext =
    typeof jsonldContext === "object"
      ? {
          ...jsonldContext,
        }
      : {};

  // here we remove all empty objects and arrays and all reoccuring inner objects that have the same @id, otherwise we would save the same object multiple times and might end up getting the old version of the object
  const jsonldDoc = {
    ...recursiveFilter(
      cleanProperty(data),
      (data, level) => level > 0 && data["@id"] === entityIRI,
    ),
    ...(finalJsonldContext ? { "@context": finalJsonldContext } : {}),
  };

  let ds = datasetFactory.dataset();
  try {
    ds = await jsonld2DataSet(jsonldDoc);
  } catch (e) {
    throw new Error("Cannot convert JSONLD to dataset", { cause: e });
  }
  try {
    const res = traverseGraphExtractBySchema(
      defaultPrefix,
      entityIRI,
      ds as Dataset,
      prepareSchema(schema, removeInverseProperties),
      walkerOptions,
    );
    return keepContext && finalJsonldContext
      ? { ...res, "@context": finalJsonldContext }
      : res;
  } catch (e) {
    throw new Error("Cannot convert JSONLD to document", { cause: e });
  }
};
