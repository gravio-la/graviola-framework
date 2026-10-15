import {
  PrimaryField,
  PrimaryFieldDeclaration,
  SPARQLFlavour,
  type ResolvedSparqlFeatureFlags,
} from "@graviola/edb-core-types";
import { resolveSparqlFeatures } from "@graviola/edb-core-utils";
import {
  effectiveInverseMap,
  isJSONSchema,
  isJSONSchemaDefinition,
  isPrimitive,
  resolveInverseForProperty,
  resolveSchema,
  type InverseMap,
} from "@graviola/json-schema-utils";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";

import { iriRef } from "../sparqlTerms";
import { assertNonNegativeInteger } from "../utils/assertNonNegativeInteger";
import type { AnnotationSelectFragments } from "./annotationProjectionsToSparql";

const makeWherePart = (queryClause: string, required: boolean) =>
  required ? queryClause : ` OPTIONAL { ${queryClause} } `;
const makePrefixedProperty = (property: string, prefix: string = "") =>
  `${prefix}:${property}`;
const makePrefixed = (key: string) => (key.includes(":") ? key : `:${key}`);
const makePrefixedPropertyPath = (path: string[]) =>
  path.map((key) => makePrefixed(key)).join("/");

const makeVariable = (path: string[]) => `?${path.join("_")}`;

type SelectPatternPhase = "full" | "page-subquery" | "page-outer";

const defaultSeparator = "; ";

const unionOptionalBranches = (branches: string[]) => {
  if (branches.length === 0) return "";
  if (branches.length === 1) {
    return makeWherePart(branches[0]!, false);
  }
  return ` OPTIONAL { ${branches.map((b) => `{ ${b.trim()} }`).join("\nUNION\n")} } `;
};

const propertiesToSPARQLSelectPatterns = (
  schema: JSONSchema7,
  rootSchema: JSONSchema7,
  currentVariable: string,
  excludedProperties?: string[],
  includedProperties?: string[],
  path?: string[],
  level: number = 0,
  primaryFields?: PrimaryFieldDeclaration,
  features?: ResolvedSparqlFeatureFlags,
  minimal?: boolean,
  phase: SelectPatternPhase = "full",
  orderByProperties: ReadonlySet<string> = new Set(),
  rootOptionalBranches?: string[],
  selectInverse?: {
    typeName?: string;
    inverseMap: InverseMap;
  },
) => {
  let where = "";
  let select = "";

  const properties = schema.properties;
  if (!properties) return { where, select };

  const emitWhere = (clause: string, required: boolean) => {
    const trimmed = clause.trim();
    if (!trimmed) return;
    if (level === 0 && phase === "page-outer" && required) {
      return;
    }
    if (
      level === 0 &&
      phase === "page-outer" &&
      !required &&
      rootOptionalBranches
    ) {
      rootOptionalBranches.push(trimmed);
      return;
    }
    where += makeWherePart(trimmed, required);
  };

  Object.entries(properties).forEach(
    ([property, subSchema]: [string, JSONSchema7]) => {
      if (
        excludedProperties?.includes(property) ||
        property.startsWith("@") ||
        (includedProperties?.length && !includedProperties.includes(property))
      )
        return;
      const subPath = [...(path ?? []), property],
        isRequired = Boolean(schema.required?.includes(property)),
        prefixedProperty = makePrefixedProperty(property),
        variable = makeVariable(subPath);

      if (level === 0 && phase === "page-subquery") {
        if (!isRequired && !orderByProperties.has(property)) {
          return;
        }
      }

      const skipSelectAggregates = phase === "page-subquery";

      if (subSchema.type === "array" && !minimal) {
        let innerWherePart = "";
        const ref = (subSchema.items as any)?.$ref as string | undefined;
        if (typeof ref === "string") {
          const typeName = ref.substring(ref.lastIndexOf("/") + 1, ref.length);
          if (primaryFields && typeName in primaryFields) {
            const fieldDecl = primaryFields[typeName];
            if (fieldDecl.label) {
              const subSubSchema = resolveSchema(
                subSchema.items as JSONSchema7,
                "",
                rootSchema as JSONSchema7,
              );
              if (
                subSubSchema &&
                isJSONSchemaDefinition(subSubSchema as JSONSchema7Definition) &&
                isJSONSchema(subSubSchema as JSONSchema7)
              ) {
                if (
                  //@ts-ignore
                  subSubSchema?.properties?.[fieldDecl.label]?.type === "string"
                ) {
                  const lableVariable = makeVariable([...subPath, "label"]);
                  innerWherePart += makeWherePart(
                    ` ${variable} ${makePrefixedProperty(
                      fieldDecl.label,
                    )} ${lableVariable} .
                  `,
                    false,
                  );
                  if (!skipSelectAggregates) {
                    select += ` (GROUP_CONCAT(DISTINCT CONCAT("[", ${lableVariable}, "](", STR(${variable}), ")"); SEPARATOR="${defaultSeparator}") AS ${lableVariable}_group) `;
                  }
                }
              }
            }
          }
        }
        if (!skipSelectAggregates) {
          if (features?.oxigraphEmptyGroupCount) {
            select += ` (IF(STRLEN(GROUP_CONCAT(DISTINCT STR(${variable}); SEPARATOR=",")) = 0, 0, COUNT(DISTINCT ${variable})) AS ${variable}_count) `;
          } else {
            select += ` (COUNT(DISTINCT ${variable}) AS ${variable}_count) `;
          }
        }
        const resolvedInverse = resolveInverseForProperty(
          selectInverse?.typeName,
          property,
          subSchema,
          rootSchema,
          selectInverse?.inverseMap,
        );
        if (resolvedInverse) {
          resolvedInverse.forEach((inverse) => {
            emitWhere(
              ` ${variable} ${makePrefixedPropertyPath(inverse.path)} ${currentVariable} . 
                ${innerWherePart}
                `,
              isRequired,
            );
          });
        } else {
          emitWhere(
            ` ${currentVariable} ${prefixedProperty} ${variable} .
            ${innerWherePart}
            `,
            isRequired,
          );
        }
      } else if (
        typeof subSchema.type === "string" &&
        isPrimitive(subSchema.type)
      ) {
        if (!skipSelectAggregates) {
          select += ` (SAMPLE(${variable}) AS ${variable}_single) `;
        }
        emitWhere(
          ` ${currentVariable} ${prefixedProperty} ${variable} . `,
          isRequired,
        );
      } else if (subSchema.type === "object" && !subSchema.$ref) {
        const { where: subWhere, select: subSelect } =
          propertiesToSPARQLSelectPatterns(
            subSchema,
            rootSchema,
            variable,
            excludedProperties,
            includedProperties,
            subPath,
            level + 1,
            primaryFields,
            features,
            minimal,
            phase === "page-subquery" ? "full" : phase,
            orderByProperties,
            undefined,
            selectInverse,
          );
        emitWhere(
          ` ${currentVariable} ${prefixedProperty} ${variable} . \n ${subWhere} `,
          isRequired,
        );
        select += subSelect;
      } else if (subSchema.$ref && !minimal) {
        const subSubSchema = resolveSchema(
          subSchema as JSONSchema7,
          "",
          rootSchema as JSONSchema7,
        );
        if (subSubSchema && subSubSchema.properties) {
          const { where: subWhere, select: subSelect } =
            propertiesToSPARQLSelectPatterns(
              subSubSchema as JSONSchema7,
              rootSchema,
              variable,
              excludedProperties,
              includedProperties,
              subPath,
              level + 1,
              primaryFields,
              features,
              true,
              phase === "page-subquery" ? "full" : phase,
              orderByProperties,
              undefined,
              selectInverse,
            );
          const typeVariable = makeVariable([...subPath, "type"]);
          const typeSampleAlias = makeVariable([...subPath, "rdf_type"]);
          const typeName = subSchema.$ref.substring(
            subSchema.$ref.lastIndexOf("/") + 1,
            subSchema.$ref.length,
          );
          let primaryInfoWhere = "";
          if (
            primaryFields &&
            typeName in primaryFields &&
            !skipSelectAggregates
          ) {
            const primaryFieldDeclaration = primaryFields[
              typeName
            ] as PrimaryField;
            Object.entries(primaryFieldDeclaration).forEach(([key, value]) => {
              const primaryMultiVariable = makeVariable([
                ...subPath,
                `${key}_all`,
              ]);
              const primaryAggAlias = makeVariable([...subPath, key, "pri"]);
              primaryInfoWhere += `OPTIONAL { ${variable} ${makePrefixedProperty(value)} ${primaryMultiVariable} . } `;
              select += ` (SAMPLE(${primaryMultiVariable}) AS ${primaryAggAlias}) `;
            });
          }
          const resolvedInverseRef = resolveInverseForProperty(
            selectInverse?.typeName,
            property,
            subSchema,
            rootSchema,
            selectInverse?.inverseMap,
          );
          if (resolvedInverseRef) {
            resolvedInverseRef.forEach((inverse) => {
              emitWhere(
                ` ${variable} ${makePrefixedPropertyPath(inverse.path)} ${currentVariable} . \n ${subWhere} \n ${primaryInfoWhere} `,
                isRequired,
              );
            });
          } else {
            emitWhere(
              ` ${currentVariable} ${prefixedProperty} ${variable} . \n ${variable} a ${typeVariable} . \n ${subWhere} \n ${primaryInfoWhere} `,
              isRequired,
            );
          }
          if (!skipSelectAggregates) {
            select += ` (SAMPLE(${variable}) AS ${variable}_IRI) (SAMPLE(${typeVariable}) AS ${typeSampleAlias}) `;
            select += subSelect;
          }
        }
      }
    },
  );

  if (level === 0 && rootOptionalBranches && rootOptionalBranches.length > 0) {
    where += unionOptionalBranches(rootOptionalBranches);
  }

  return {
    where,
    select,
  };
};

type MultiSortOrder = {
  descending: boolean;
  orderBy: string;
}[];

type SPARQLSelectOptions = {
  orderBy?: string | MultiSortOrder;
  descending?: boolean;
  limit?: number;
  offset?: number;
  primaryFields?: PrimaryFieldDeclaration;
  typeName?: string;
  inverses?: InverseMap;
};

export const orderByPropertyNames = (
  orderBy?: string | MultiSortOrder,
): string[] => {
  if (!orderBy) return [];
  if (typeof orderBy === "string") {
    return [orderBy.replace(/^\?/, "")];
  }
  return orderBy.map(({ orderBy: key }) => key.replace(/^\?/, ""));
};

const sparqlPartFromOptions = (
  options: SPARQLSelectOptions,
  includePagination = true,
) => {
  const sparqlParts = [];
  sparqlParts.push(` ORDER BY `);
  if (typeof options.orderBy === "string") {
    sparqlParts.push(
      ` ${options?.descending ? "DESC" : "ASC"}(${options.orderBy})`,
    );
  } else if (Array.isArray(options.orderBy) && options.orderBy.length > 0) {
    sparqlParts.push(
      ` ${options.orderBy
        .map(
          ({ orderBy, descending }) =>
            `${descending ? "DESC" : "ASC"}(?${orderBy})`,
        )
        .join(" ")}`,
    );
  }
  sparqlParts.push(` ASC(?entity) `);
  if (includePagination) {
    if (options.limit !== undefined) {
      sparqlParts.push(
        `LIMIT ${assertNonNegativeInteger("limit", options.limit)}`,
      );
    }
    if (options.offset !== undefined) {
      sparqlParts.push(
        `OFFSET ${assertNonNegativeInteger("offset", options.offset)}`,
      );
    }
  }
  return sparqlParts.join("\n");
};

/**
 * creates the WHERE clause of a SPARQL SELECT query from a JSON Schema
 *
 * it will create a query that will return all the properties of instances of the given type
 *
 * primitive properties will be returned as is
 * for sub-object properties will be build recursively
 * lists will be counted:
 *
 * @param rootSchema
 * @param typeIRI
 * @param excludeProperties
 * @param sparqlSelectOptions
 */
export const jsonSchema2Select = (
  rootSchema: JSONSchema7,
  typeIRI?: string,
  excludeProperties?: string[],
  includedProperties?: string[],
  sparqlSelectOptions?: SPARQLSelectOptions,
  countResults?: boolean,
  flavour?: SPARQLFlavour,
  minimal?: boolean,
  annotation?: AnnotationSelectFragments,
) => {
  if (!rootSchema.properties) return "";
  const variable = "?entity";
  const features = resolveSparqlFeatures(flavour);
  const matchType = typeIRI ? `?entity a ${iriRef(typeIRI)} .` : "";

  if (countResults) {
    return `SELECT (COUNT(DISTINCT ${variable}) AS ?entity_count) WHERE {
    ${matchType}
    ${annotation?.where ?? ""}
}`;
  }

  const orderByProps = new Set(
    orderByPropertyNames(sparqlSelectOptions?.orderBy),
  );
  const usePagedSubquery =
    sparqlSelectOptions !== undefined &&
    (sparqlSelectOptions.limit !== undefined ||
      sparqlSelectOptions.offset !== undefined);

  let where = "";
  let select = "";

  const selectInverse = {
    typeName: sparqlSelectOptions?.typeName,
    inverseMap: effectiveInverseMap(rootSchema, sparqlSelectOptions?.inverses),
  };

  if (usePagedSubquery) {
    const sub = propertiesToSPARQLSelectPatterns(
      rootSchema,
      rootSchema,
      variable,
      excludeProperties,
      includedProperties,
      [],
      0,
      sparqlSelectOptions?.primaryFields,
      features,
      minimal,
      "page-subquery",
      orderByProps,
      undefined,
      selectInverse,
    );
    const outerBranches: string[] = [];
    const outer = propertiesToSPARQLSelectPatterns(
      rootSchema,
      rootSchema,
      variable,
      excludeProperties,
      includedProperties,
      [],
      0,
      sparqlSelectOptions?.primaryFields,
      features,
      minimal,
      "page-outer",
      orderByProps,
      outerBranches,
      selectInverse,
    );
    select = outer.select;
    const subqueryPagination = sparqlPartFromOptions(sparqlSelectOptions, true);
    const outerOrder = sparqlPartFromOptions(sparqlSelectOptions, false);
    const sparqlFinish = `GROUP BY ${variable} \n ${outerOrder}`;
    const finalSelect = `DISTINCT ${variable} ${select}${annotation?.select ?? ""}`;
    return `SELECT ${finalSelect} WHERE {
    {
      SELECT ${variable} WHERE {
        ${matchType}
        ${sub.where}
        ${annotation?.where ?? ""}
      }
      ${subqueryPagination}
    }
    ${outer.where}
}
${sparqlFinish}`;
  }

  const full = propertiesToSPARQLSelectPatterns(
    rootSchema,
    rootSchema,
    variable,
    excludeProperties,
    includedProperties,
    [],
    0,
    sparqlSelectOptions?.primaryFields,
    features,
    minimal,
    "full",
    orderByProps,
    [],
    selectInverse,
  );
  where = full.where;
  select = full.select;

  const sparqlFinish =
    sparqlSelectOptions && !countResults
      ? `GROUP BY ${variable} \n ${sparqlPartFromOptions(sparqlSelectOptions)}`
      : "";
  const finalSelect = `DISTINCT ${variable} ${select}${annotation?.select ?? ""}`;
  return `SELECT ${finalSelect} WHERE {
    ${matchType}
    ${where}
    ${annotation?.where ?? ""}
}
${sparqlFinish}`;
};
