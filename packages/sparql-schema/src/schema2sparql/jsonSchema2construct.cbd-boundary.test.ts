/**
 * DELETE-template boundary semantics of `jsonSchema2construct`.
 *
 * Regression for: saving a `Location` whose `parent` is another `Location`
 * wiped the parent (and grand-parents) from the store. The generated schema
 * (LinkML → JSON Schema) carried no `@id` on referenced definitions, so the
 * TBox stop-symbol guard never fired and the DELETE template expanded four
 * levels into *linked named entities*.
 *
 * The builder now additionally anchors every nested expansion in a
 * `{ <link> FILTER(isBlank(?o)) … }` branch: only anonymous
 * (blank-node) objects — the actual CBD of the subject — are ever expanded.
 *
 * The patterns are the branches of one UNION (not a chain of OPTIONALs), so
 * the number of solutions is the sum of the stored values, not their product.
 */
import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { jsonSchema2construct } from "./jsonSchema2construct";

const SUBJECT = "http://example.org/entity/Location/malaga-city";

/** Shape emitted by the LinkML generator when classes have no identifier slot. */
const schemaWithoutIds: JSONSchema7 = {
  type: "object",
  definitions: {
    AuthorityLink: {
      type: "object",
      properties: {
        "@type": { type: "string", const: "http://example.org/AuthorityLink" },
        authority: { type: "string", format: "uri" },
        id: { type: "string" },
      },
    },
    Location: {
      type: "object",
      required: ["title"],
      properties: {
        "@type": { type: "string", const: "http://example.org/Location" },
        title: { type: "string" },
        country: { type: "string" },
        idAuthority: { $ref: "#/definitions/AuthorityLink" },
        parent: { $ref: "#/definitions/Location" },
      },
    },
  },
  // root = Location (as produced by bringDefinitionToTop)
  required: ["title"],
  properties: {
    "@type": { type: "string", const: "http://example.org/Location" },
    title: { type: "string" },
    country: { type: "string" },
    idAuthority: { $ref: "#/definitions/AuthorityLink" },
    parent: { $ref: "#/definitions/Location" },
  },
};

const blocksOf = (where: string) =>
  where.split("\n").filter((line) => line.trim().length > 0);

describe("jsonSchema2construct — CBD boundary guard", () => {
  test("every nested expansion is anchored on its link and filtered to blank nodes", () => {
    const { whereOptionals } = jsonSchema2construct(
      SUBJECT,
      schemaWithoutIds,
      ["@id"],
      ["@id", "@type"],
    );

    // parent link is matched on its own (so a stale IRI link is still deleted)…
    expect(whereOptionals).toContain(
      `{\n<${SUBJECT}> :parent ?parent_7 .\n}\nUNION`,
    );
    // …and the expansion into ?parent_7 is a separate branch, guarded by isBlank
    expect(whereOptionals).toContain(
      `{\n<${SUBJECT}> :parent ?parent_7 .\nFILTER(isBlank(?parent_7))\n`,
    );

    // no nested subject is ever expanded without a blank-node guard
    const nestedSubjects = new Set(
      [...whereOptionals.matchAll(/^(\?[A-Za-z_]+_\d+) (?:a|:\w+) /gm)].map(
        (m) => m[1],
      ),
    );
    expect(nestedSubjects.size).toBeGreaterThan(0);
    for (const v of nestedSubjects) {
      expect(whereOptionals).toContain(`FILTER(isBlank(${v}))`);
    }
  });

  test("no pattern is required: every property is a UNION branch of its own", () => {
    const { whereOptionals, whereRequired } = jsonSchema2construct(
      SUBJECT,
      schemaWithoutIds,
      ["@id"],
      ["@id", "@type"],
    );
    // `title` is required in the schema. For a DELETE that must not matter: a
    // stored entity without a title still has to lose its other triples.
    expect(whereRequired).toBe("");
    expect(whereOptionals).toContain(
      `{\n<${SUBJECT}> :title ?title_1 .\n}\nUNION`,
    );
    // nested Location.title (required in schema) is a branch inside the guard
    const nestedTitle = blocksOf(whereOptionals).find((l) =>
      /^\?parent_\d+ :title/.test(l),
    );
    expect(nestedTitle).toBeDefined();
    const idx = whereOptionals.indexOf(nestedTitle!);
    expect(whereOptionals.slice(idx - 2, idx)).toBe("{\n");

    // Sibling OPTIONALs would make the cost the product of all stored values.
    expect(whereOptionals).not.toContain("OPTIONAL");
    // Every top-level branch is separated by UNION: type, title, country,
    // idAuthority (link + nested), parent (link + nested).
    const topLevel = whereOptionals
      .split("\n")
      .filter(
        (line) =>
          line.startsWith(`<${SUBJECT}>`) || line.includes(`{ <${SUBJECT}> a `),
      );
    expect(topLevel).toHaveLength(7);
  });

  test("balanced braces", () => {
    const { whereOptionals } = jsonSchema2construct(
      SUBJECT,
      schemaWithoutIds,
      ["@id"],
      ["@id", "@type"],
    );
    const open = (whereOptionals.match(/{/g) ?? []).length;
    const close = (whereOptionals.match(/}/g) ?? []).length;
    expect(open).toBe(close);
  });

  test("schema-level @id boundary still short-circuits expansion entirely", () => {
    const withIds: JSONSchema7 = JSON.parse(JSON.stringify(schemaWithoutIds));
    (withIds.definitions!.Location as JSONSchema7).properties!["@id"] = {
      type: "string",
    };
    const { whereOptionals, construct } = jsonSchema2construct(
      SUBJECT,
      withIds,
      ["@id"],
      ["@id", "@type"],
    );
    expect(construct).toContain(`<${SUBJECT}> :parent ?parent_`);
    expect(construct).not.toMatch(/\?parent_\d+ :title/);
    // AuthorityLink (no @id) is still expanded, but guarded
    expect(whereOptionals).toMatch(/FILTER\(isBlank\(\?idAuthority_\d+\)\)/);
    expect(whereOptionals).not.toMatch(/FILTER\(isBlank\(\?parent_\d+\)\)/);
  });
});
