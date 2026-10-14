import { describe, expect, test } from "bun:test";
import { JSONSchema7 } from "json-schema";
// oxigraph is a dependency of sparql-db-impl; sparql-schema does not list it.
import { Store } from "../../../sparql-db-impl/node_modules/oxigraph";

import { jsonSchema2Select } from "./jsonSchema2Select";

const schema: JSONSchema7 = {
  type: "object",
  required: ["citation"],
  properties: {
    citation: { type: "string" },
    text: { type: "string" },
    depth: { type: "integer" },
  },
};

const typeIRI = "http://example.org/Provision";
const data = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

<http://example.org/a> rdf:type <http://example.org/Provision> ; <http://example.org/citation> "a1" ; <http://example.org/text> "one" .
<http://example.org/b> rdf:type <http://example.org/Provision> ; <http://example.org/citation> "b1" .
<http://example.org/c> rdf:type <http://example.org/Provision> ; <http://example.org/citation> "c1" ; <http://example.org/depth> 2 .
<http://example.org/other> rdf:type <http://example.org/Other> ; <http://example.org/citation> "x" .
`;

function countFromQuery(store: Store, sparql: string): number {
  const rows = [
    ...(store.query(sparql) as Iterable<{
      get: (name: string) => { value: string } | undefined;
    }>),
  ];
  const row = rows[0];
  return Number(row?.get("entity_count")?.value ?? row?.get("c")?.value ?? 0);
}

describe("jsonSchema2Select count equivalence", () => {
  test("count matches plain type count on a small graph", () => {
    const store = new Store();
    store.load(data, { format: "text/turtle" });
    const plain = `SELECT (COUNT(DISTINCT ?entity) AS ?entity_count) WHERE { ?entity a <${typeIRI}> . }`;
    const generated = jsonSchema2Select(
      schema,
      typeIRI,
      [],
      [],
      undefined,
      true,
    );
    expect(countFromQuery(store, plain)).toBe(3);
    expect(countFromQuery(store, generated)).toBe(3);
  });
});
