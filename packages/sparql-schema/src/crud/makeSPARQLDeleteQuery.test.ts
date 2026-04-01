/**
 * Tests for makeSPARQLDeleteQuery
 *
 * Key bug: the DELETE query recursively expands all $ref schemas (up to maxRecursion=4),
 * causing it to include properties of referenced entities (e.g. Volunteer's name/email)
 * in the DELETE clause. This would corrupt data in the triplestore when removing an entity
 * that has $ref-linked relations.
 *
 * The fix: pass `options.maxRecursion ?? 0` to jsonSchema2construct so that the DELETE
 * query only covers the direct properties of the root entity being deleted.
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

  test("DELETE query should NOT include properties of $ref-referenced entities", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );

    // Direct properties of Reaction → must be present
    expect(query).toContain(":reactionType");
    expect(query).toContain(":createdAt");
    expect(query).toContain(":createdBy"); // the IRI link is fine

    // Properties of the referenced User entity → must NOT appear
    // These would corrupt the User's data if executed
    expect(query).not.toContain(":name");
    expect(query).not.toContain(":email");
    expect(query).not.toContain(":tags");

    // Properties of User's referenced Tag entity → must NOT appear either
    expect(query).not.toContain(":title");
    expect(query).not.toContain(":color");
  });

  test("DELETE clause should have at most 4 triple patterns for a 3-property entity", () => {
    const query = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );

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

    // Expected max 4: ?__type_0, :reactionType, :createdAt, :createdBy
    // Before fix this generates 20+ patterns including User/Tag properties
    expect(deleteTriples.length).toBeLessThanOrEqual(4);
  });

  test("DELETE query should be stable with maxRecursion: 0 passed explicitly", () => {
    const queryDefault = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      options,
    );
    const queryExplicit0 = makeSPARQLDeleteQuery(
      entityIRI,
      typeIRI,
      reactionLikeSchema,
      { ...options, maxRecursion: 0 },
    );

    // Both should produce the same result — maxRecursion: 0 is the expected default for DELETE
    expect(queryDefault).toEqual(queryExplicit0);
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
