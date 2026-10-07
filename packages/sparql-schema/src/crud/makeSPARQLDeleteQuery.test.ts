/**
 * Tests for makeSPARQLDeleteQuery
 *
 * Two bugs meet here, and the query has to avoid both:
 *
 * 1. Deleting too much: the DELETE once expanded all $ref schemas without any
 *    guard, so removing a Reaction also removed the name/email of the Volunteer
 *    it linked to. The first fix limited the DELETE to the entity's direct
 *    properties (`maxRecursion ?? 0`).
 * 2. Deleting too little: with depth 0 the anonymous objects an entity owns
 *    (blank nodes: an address, a date range) stayed behind as orphans after
 *    every remove.
 *
 * What holds both: nested objects are followed, but only behind a blank-node
 * guard (`FILTER(isBlank(?o))`), and never into a definition that declares
 * `@id`. A named entity is never touched, whatever the schema says.
 */

import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { makeSPARQLDeleteQuery } from "./makeSPARQLDeleteQuery";

/**
 * Simplified schema mimicking the real Reaction → Volunteer → Tag nesting
 * that caused the 417-line DELETE query bug.
 */
const reactionLikeSchema: JSONSchema7 = {
  type: "object",
  title: "Reaction",
  definitions: {
    User: {
      type: "object",
      title: "User",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        tags: {
          type: "array",
          items: { $ref: "#/definitions/Tag" },
        },
      },
    },
    Tag: {
      type: "object",
      title: "Tag",
      properties: {
        title: { type: "string" },
        color: { type: "string" },
      },
    },
  },
  properties: {
    reactionType: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    createdBy: { $ref: "#/definitions/User" },
  },
};

const entityIRI = "https://example.com/Reaction/abc123";
const typeIRI = "https://example.com/Reaction";
const options = {
  defaultPrefix: "https://example.com/",
  queryBuildOptions: { sparqlFlavour: "oxigraph" as const },
};

describe("makeSPARQLDeleteQuery", () => {
  test("log the generated DELETE query for continuous inspection", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );
    console.log(
      "\n=== Generated DELETE Query ===\n",
      query,
      "\n==============================\n",
    );
    expect(query).toBeDefined();
    expect(query.length).toBeGreaterThan(0);
  });

  test("properties of a $ref-referenced object are only matched behind a blank-node guard", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );
    const where = query.substring(query.indexOf("WHERE"));

    // Direct properties of Reaction → must be present
    expect(where).toContain(":reactionType");
    expect(where).toContain(":createdAt");
    expect(where).toContain(":createdBy"); // the link itself is always removed

    // The schema declares no `@id` on User and Tag, so they may be anonymous
    // objects owned by the Reaction. Their properties are matched — but every
    // nested subject is guarded: a User that is a named node is not touched.
    const nestedSubjects = new Set(
      [...where.matchAll(/(\?[A-Za-z]+_\d+) (?:a|:\w+) \?/g)].map((m) => m[1]),
    );
    expect([...nestedSubjects].some((v) => v.startsWith("?createdBy_"))).toBe(
      true,
    );
    for (const v of nestedSubjects) {
      expect(where, `guard for ${v}`).toContain(`FILTER(isBlank(${v}))`);
    }
  });

  test("a referenced definition that declares @id is never expanded", () => {
    const named = structuredClone(reactionLikeSchema);
    (named.definitions!.User as JSONSchema7).properties!["@id"] = {
      type: "string",
    };
    const query = makeSPARQLDeleteQuery(entityIRI, typeIRI, named, options);

    expect(query).toContain(":createdBy"); // the link is removed
    // Nothing of the User (and so nothing of its Tags) appears at all
    expect(query).not.toContain(":name");
    expect(query).not.toContain(":email");
    expect(query).not.toContain(":tags");
    expect(query).not.toContain(":title");
    expect(query).not.toContain(":color");
    expect(query).not.toContain("isBlank");
  });

  test("DELETE clause has 4 triple patterns for a 3-property entity with a named reference", () => {
    const named = structuredClone(reactionLikeSchema);
    (named.definitions!.User as JSONSchema7).properties!["@id"] = {
      type: "string",
    };
    const query = makeSPARQLDeleteQuery(entityIRI, typeIRI, named, options);

    // Extract DELETE { ... } block (non-greedy match)
    const deleteBlockMatch = query.match(/DELETE\s*\{([\s\S]*?)\}/);
    expect(deleteBlockMatch).not.toBeNull();

    const deleteTriples = deleteBlockMatch![1]
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    console.log(
      `\nDELETE block has ${deleteTriples.length} triple pattern(s):\n`,
      deleteTriples.join("\n"),
      "\n",
    );

    // Exactly 4: ?__type_0, :reactionType, :createdAt, :createdBy
    expect(deleteTriples.length).toBe(4);
  });

  test("the WHERE is a UNION of independent branches: no chain of OPTIONALs, nothing required", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );
    const where = query.substring(query.indexOf("WHERE"));
    // A chain of OPTIONALs would make the cost the product of all stored values.
    expect(where).not.toContain("OPTIONAL");
    expect((where.match(/\nUNION\n/g) ?? []).length).toBeGreaterThanOrEqual(3);
    const open = (where.match(/{/g) ?? []).length;
    const close = (where.match(/}/g) ?? []).length;
    expect(open).toBe(close);
  });

  test("maxRecursion: 0 passed explicitly limits the DELETE to the entity's direct properties", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      { ...options, maxRecursion: 0 },
    );

    expect(query).toContain(":reactionType");
    expect(query).toContain(":createdBy");
    expect(query).not.toContain(":name");
    expect(query).not.toContain(":email");
    expect(query).not.toContain("isBlank");
  });

  test("maxRecursion: 1 should include User properties but NOT Tag properties", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      { ...options, maxRecursion: 1 },
    );

    // At depth 1, User properties are included
    expect(query).toContain(":name");
    expect(query).toContain(":email");

    // But Tag properties (depth 2) must still be absent
    expect(query).not.toContain(":title");
    expect(query).not.toContain(":color");
  });
});
