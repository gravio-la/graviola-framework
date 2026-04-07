/**
 * RDF term ↔ canonical N-Triples string serialization.
 *
 * We use N-Triples as the dictionary key format because it is:
 *   1. Unambiguous — each term maps to exactly one string representation
 *   2. Canonical — the n3 library produces consistent output
 *   3. Reversible — we can parse back to an RDF term using N3.DataFactory
 *
 * The default graph is serialized as "" (empty string) as a sentinel,
 * since N-Triples has no representation for the default graph name.
 */

import type {
  BlankNode,
  DefaultGraph,
  Literal,
  NamedNode,
  Term,
} from "@rdfjs/types";
import N3 from "n3";

const { DataFactory } = N3;
const { namedNode, blankNode, literal, defaultGraph } = DataFactory;

/**
 * Serialize an RDF term to its canonical N-Triples string representation.
 * Used as the dictionary key in the "terms" object store.
 */
export function termToString(term: Term): string {
  switch (term.termType) {
    case "NamedNode":
      return `<${term.value}>`;

    case "BlankNode":
      return `_:${term.value}`;

    case "Literal": {
      const lit = term as Literal;
      const escaped = escapeLiteralValue(lit.value);
      if (lit.language) {
        return `"${escaped}"@${lit.language}`;
      }
      if (
        lit.datatype &&
        lit.datatype.value !== "http://www.w3.org/2001/XMLSchema#string"
      ) {
        return `"${escaped}"^^<${lit.datatype.value}>`;
      }
      return `"${escaped}"`;
    }

    case "DefaultGraph":
      // Sentinel: the default graph has no N-Triples representation.
      // We use the empty string since no valid N-Triples term starts with "".
      return "";

    case "Variable":
      // Variables should never appear in stored quads.
      throw new Error(`Cannot serialize Variable term: ?${term.value}`);

    default:
      throw new Error(`Unknown term type: ${(term as any).termType}`);
  }
}

/**
 * Parse a canonical N-Triples string back to an RDF term.
 * Inverse of termToString.
 */
export function stringToTerm(s: string): Term {
  if (s === "") {
    return defaultGraph();
  }
  if (s.startsWith("<") && s.endsWith(">")) {
    return namedNode(s.slice(1, -1));
  }
  if (s.startsWith("_:")) {
    return blankNode(s.slice(2));
  }
  if (s.startsWith('"')) {
    return parseLiteral(s);
  }
  throw new Error(`Cannot parse term string: ${JSON.stringify(s)}`);
}

/**
 * Escape special characters in a literal value for N-Triples serialization.
 * Per the N-Triples spec, we escape: \, ", \n, \r, \t
 */
function escapeLiteralValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Unescape N-Triples escape sequences in a literal value.
 */
function unescapeLiteralValue(value: string): string {
  return value
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/**
 * Parse a quoted literal string (with optional language tag or datatype).
 * Handles three forms:
 *   "value"
 *   "value"@lang
 *   "value"^^<datatype>
 */
function parseLiteral(s: string): Literal {
  // Find the closing quote, accounting for escaped quotes
  let i = 1;
  while (i < s.length) {
    if (s[i] === "\\") {
      i += 2; // skip escaped character
    } else if (s[i] === '"') {
      break;
    } else {
      i++;
    }
  }

  const rawValue = s.slice(1, i);
  const value = unescapeLiteralValue(rawValue);
  const rest = s.slice(i + 1);

  if (rest.startsWith("@")) {
    return literal(value, rest.slice(1));
  }
  if (rest.startsWith("^^<") && rest.endsWith(">")) {
    const datatypeIRI = rest.slice(3, -1);
    return literal(value, namedNode(datatypeIRI));
  }
  // Plain string literal (xsd:string)
  return literal(value);
}
