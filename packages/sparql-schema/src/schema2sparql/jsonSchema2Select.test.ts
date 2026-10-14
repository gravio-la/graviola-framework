import { describe, expect, test } from "bun:test";
import { JSONSchema7 } from "json-schema";

import { jsonSchema2Select } from "./jsonSchema2Select";

const schema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/person.schema.json",
  title: "Person",
  description: "A human being",
  type: "object",
  required: ["name", "father"],
  properties: {
    name: {
      type: "string",
    },
    knows: {
      type: "array",
      items: {
        required: ["nick"],
        properties: {
          nick: { type: "string" },
        },
      },
    },
    father: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

const schema2: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/person.schema.json",
  title: "Person",
  description: "A human being",
  type: "object",
  required: ["name", "father"],
  properties: {
    name: {
      type: "string",
    },
    knows: {
      type: "array",
      items: {
        required: ["nick"],
        properties: {
          nick: { type: "string" },
        },
      },
    },
    father: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

describe("make select query", () => {
  test("should make a select query", () => {
    const query = jsonSchema2Select(schema, "http://example.com/person");
    //trim whitespace on each line
    const strippedQuery = query.replace(/^\s+|\s+$/gm, "");
    expect(strippedQuery).toContain("?entity a <http://example.com/person> .");
    expect(strippedQuery).toContain("?entity :name ?name .");
    expect(strippedQuery).toContain("OPTIONAL { ?entity :knows ?knows . }");
  });

  test("empty includedProperties does not exclude all domain properties", () => {
    const query = jsonSchema2Select(
      schema,
      "http://example.com/person",
      [],
      [],
    );
    expect(query).toContain("?name_single");
    expect(query).toContain("?father_name_single");
  });

  test("count query binds only the type pattern", () => {
    const query = jsonSchema2Select(
      schema,
      "http://example.com/person",
      [],
      [],
      undefined,
      true,
    );
    expect(query).toEqual(
      "SELECT (COUNT(DISTINCT ?entity) AS ?entity_count) WHERE {\n    ?entity a <http://example.com/person> .\n    \n}",
    );
    expect(query).not.toContain("OPTIONAL");
  });

  test("paginated list uses a type-first subquery and UNION sibling optionals", () => {
    const query = jsonSchema2Select(
      schema,
      "http://example.com/person",
      [],
      ["name", "knows"],
      {
        orderBy: "name",
        limit: 10,
        offset: 0,
      },
    );
    expect(query).toContain("SELECT ?entity WHERE");
    expect(query).toContain("?entity a <http://example.com/person> .");
    expect(query).toContain("?entity :name ?name .");
    const subqueryBody =
      query.match(
        /SELECT \?entity WHERE \{([\s\S]*?)\}\s*\n\s*ORDER BY/,
      )?.[1] ?? "";
    expect(subqueryBody).not.toContain(":knows");
    expect(query).toContain("OPTIONAL { ?entity :knows ?knows . }");
    expect(query).toContain("LIMIT 10");
    expect(query).toContain("GROUP BY ?entity");
  });
});
