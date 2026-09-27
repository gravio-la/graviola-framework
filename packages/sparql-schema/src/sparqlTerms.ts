import { assertSafeIri } from "@graviola/edb-core-utils";

/** `<value>` for a validated IRI; throws `InvalidIriError` (edb-core-utils) otherwise. */
export const iriRef = (value: string): string => `<${assertSafeIri(value)}>`;

export const sparqlStringLiteral = (value: string): string => {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\x08/g, "\\b")
    .replace(/\f/g, "\\f");
  return `"${escaped}"`;
};

/**
 * Sanitize a name for use as a SPARQL variable (alphanumeric and underscore only).
 */
export const toSparqlVariableName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
  if (!/^[a-zA-Z]/.test(cleaned)) return `var_${cleaned}`;
  return cleaned;
};
