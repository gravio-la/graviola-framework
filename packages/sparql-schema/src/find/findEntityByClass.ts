import { withDefaultPrefix } from "@/crud";
import { Entity, QueryOptions } from "@graviola/edb-core-types";
import df from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";

export type FindEntityByClassOptions = QueryOptions & {
  /**
   * When `false`, substring match is case-sensitive.
   * When `true` or omitted, match follows SQL LIKE–style case-insensitive substring semantics.
   */
  searchInsensitive?: boolean;
};

/**
 * This function will ensure that GROUP BY is always before ORDER BY
 * unfortunatly the SPARQL builder does not ensure this, but it might be fixed upstream
 * in the future
 * @param sparqlQuery - The SPARQL query to fix
 * @returns The fixed SPARQL query
 */
export const fixSparqlOrder: (sparqlQuery: string) => string = (
  sparqlQuery,
) => {
  const regex = /(ORDER BY\s+[^ ]+)(\s*)GROUP BY\s+\(([^\)]+)\)/gm;
  return sparqlQuery.replace(regex, "GROUP BY $3 $2\n$1");
};

/**
 * This function will convert a field name to a predicate
 * and ensure it only contains alphanumeric, dashes and underscores
 * @param field - The field name to convert
 * @returns The converted predicate
 */
const toPredicate = (field: string) => {
  //only allow alphanumeric, dashes and underscores
  const cleanField = field.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleanField.startsWith(":") ? cleanField : `:${cleanField}`;
};

export type FindEntityByClassFn = (
  searchString: string | null,
  typeIRI: string,
  doQuery: (query: string) => Promise<any>,
  options: FindEntityByClassOptions,
  limit?: number,
) => Promise<Entity[]>;

export const findEntityByClass: FindEntityByClassFn = async (
  searchString: string | null,
  typeIRI: string,
  doQuery: (query: string) => Promise<any>,
  options,
  limit?: number,
) => {
  const { queryBuildOptions, defaultPrefix, searchInsensitive } = options;
  const likeInsensitive = searchInsensitive !== false;
  const { primaryFields, typeIRItoTypeName } = queryBuildOptions;
  const primaryFieldDeclaration = primaryFields?.[typeIRItoTypeName(typeIRI)];
  const { label, description, image } = primaryFieldDeclaration || {};
  const labelPredicate = label ? toPredicate(label) : ":name";
  const titlePredicate = ":title";
  const descriptionPredicate = description
    ? toPredicate(description)
    : ":description";
  const imagePredicate = image ? toPredicate(image) : ":image";
  const subjectV = df.variable("subject"),
    nameV = df.variable("name"),
    titleV = df.variable("title"),
    descriptionV = df.variable("description"),
    imageV = df.variable("image"),
    concatenatedV = df.variable("concatenated"),
    safeNameV = df.variable("safeName"),
    safeTitleV = df.variable("safeTitle"),
    safeDescriptionV = df.variable("safeDescription"),
    safeImageV = df.variable("safeImage"),
    oneOfLabelOrDesc = df.variable("oneOfTitle"),
    firstOneOfTitleV = df.variable("firstOneOfTitle"),
    firstImageV = df.variable("firstImage"),
    firstDescriptionV = df.variable("firstDescription");

  let query;
  if (searchString && searchString.length > 0) {
    const searchLiteral = df.literal(searchString);
    const searchFilter = likeInsensitive
      ? sparql`FILTER(contains(lcase(str(${concatenatedV})), lcase(${searchLiteral}))) .
            `
      : sparql`FILTER(contains(str(${concatenatedV}), ${searchLiteral})) .
            `;
    query = SELECT.DISTINCT` ${subjectV} (SAMPLE(${oneOfLabelOrDesc}) AS ${firstOneOfTitleV}) (SAMPLE(${imageV}) AS ${firstImageV}) (SAMPLE(${descriptionV}) AS ${firstDescriptionV})`
      .WHERE`
          ${subjectV} a <${typeIRI}> .
            OPTIONAL {${subjectV} ${labelPredicate} ${nameV} .}
            OPTIONAL {${subjectV} ${titlePredicate} ${titleV} .}
            OPTIONAL {${subjectV} ${descriptionPredicate} ${descriptionV} .}
            OPTIONAL {${subjectV} ${imagePredicate} ${imageV} .}

            BIND (COALESCE(${nameV}, "") AS ${safeNameV})
            BIND (COALESCE(${titleV}, "") AS ${safeTitleV})
            BIND (COALESCE(${descriptionV}, "") AS ${safeDescriptionV})
            BIND (COALESCE(${imageV}, "") AS ${safeImageV})
            BIND (COALESCE(${nameV}, ${titleV}, ${descriptionV}, "") AS ${oneOfLabelOrDesc})

            BIND (CONCAT(${safeNameV}, " ", ${safeTitleV}, " ", ${safeDescriptionV}) AS ${concatenatedV})
            ${searchFilter}

            FILTER isIRI(${subjectV})
            FILTER (strlen(${oneOfLabelOrDesc}) > 0)
        `;
  } else {
    query = SELECT.DISTINCT` ${subjectV} (SAMPLE(${oneOfLabelOrDesc}) AS ${firstOneOfTitleV}) (SAMPLE(${imageV}) AS ${firstImageV}) (SAMPLE(${descriptionV}) AS ${firstDescriptionV})`
      .WHERE`
          ${subjectV} a <${typeIRI}> .
            OPTIONAL {${subjectV} ${labelPredicate} ${nameV} .}
            OPTIONAL {${subjectV} ${titlePredicate} ${titleV} .}
            OPTIONAL {${subjectV} ${descriptionPredicate} ${descriptionV} .}
            BIND (COALESCE(${nameV}, ${titleV}, ${descriptionV}, "") AS ${oneOfLabelOrDesc})
            FILTER isIRI(${subjectV})
            FILTER (strlen(${oneOfLabelOrDesc}) > 0)
        `;
  }
  if (typeof limit === "number") query = query.LIMIT(limit);
  query = query.GROUP().BY(subjectV).ORDER().BY(firstOneOfTitleV);
  const fixedQuery = fixSparqlOrder(query.build(queryBuildOptions));
  const queryString = withDefaultPrefix(defaultPrefix, fixedQuery);
  try {
    const bindings = await doQuery(queryString);
    if (!bindings) return [];
    return bindings
      .map((binding: any) => ({
        entityIRI: binding[subjectV.value]?.value,
        typeIRI: typeIRI,
        name: binding[safeNameV.value]?.value,
        value: binding[subjectV.value]?.value,
        label: binding[firstOneOfTitleV.value]?.value,
        description: binding[firstDescriptionV.value]?.value,
        image: binding[firstImageV.value]?.value,
      }))
      .filter((entity: Entity) => entity.entityIRI);
  } catch (e) {
    console.error("Error finding entity by class", e);
    return [];
  }
};
