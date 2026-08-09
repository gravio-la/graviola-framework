import { QueryBuilderOptions } from "@graviola/edb-core-types";
import { filterUndefOrNull } from "@graviola/edb-core-utils";
import { Term } from "@rdfjs/types";

/** SPARQL JSON binding cell or RDF/JS Term. */
type BindingCell =
  | Term
  | { type?: string; termType?: string; value?: string }
  | undefined;

type Bindings = Record<string, BindingCell>[];

export type FindEntityByAuthorityIRIFn = (
  authorityIRI: string,
  typeIRI: string | undefined,
  doQuery: (query: string) => Promise<Bindings>,
  limit?: number,
  options?: QueryBuilderOptions,
) => Promise<string[]>;

const escapeLiteral = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const subjectIriFromBinding = (cell: BindingCell): string | undefined => {
  if (!cell || typeof cell !== "object" || typeof cell.value !== "string") {
    return undefined;
  }
  // RDF/JS Term
  if (cell.termType === "NamedNode") return cell.value;
  // SPARQL Results JSON (selectFetch from httpSparqlCrud)
  if (cell.type === "uri") return cell.value;
  return undefined;
};

/**
 * Find local entities linked to a secondary authority identifier.
 *
 * Matches any of:
 * - `:idAuthority/:id` (mapping-strategy staging shape)
 * - `:sameAs` as IRI or string literal (schema field used by geo imports)
 * - `owl:sameAs` (common in seed Turtle)
 *
 * `doQuery` may return either SPARQL Results JSON cells (`{ type, value }`)
 * or RDF/JS Terms (`{ termType, value }`).
 */
export const findEntityByAuthorityIRI: FindEntityByAuthorityIRIFn = async (
  authorityIRI,
  typeIRI,
  doQuery,
  limit = 10,
  options,
) => {
  const defaultPrefix = options?.defaultPrefix ?? "";
  const typePattern = typeIRI ? `  ?subject a <${typeIRI}> .` : "";
  const literal = escapeLiteral(authorityIRI);

  const query = `PREFIX : <${defaultPrefix}>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
SELECT DISTINCT ?subject WHERE {
  {
    ?subject :idAuthority/:id <${authorityIRI}> .
  } UNION {
    ?subject :sameAs <${authorityIRI}> .
  } UNION {
    ?subject :sameAs "${literal}" .
  } UNION {
    ?subject owl:sameAs <${authorityIRI}> .
  }
${typePattern}
}
LIMIT ${limit}`;

  const bindings = await doQuery(query);
  return filterUndefOrNull(
    bindings.map((binding) => subjectIriFromBinding(binding.subject)),
  );
};
