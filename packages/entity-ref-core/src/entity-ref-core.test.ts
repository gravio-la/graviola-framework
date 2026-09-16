import { describe, expect, test } from "bun:test";

import {
  extractEntityRefs,
  parseEntityQuerySpec,
  parseGraviolaUri,
  parseWikilink,
  resolveEntityIRI,
  serializeEntityRef,
  splitFrontmatter,
  stripFrontmatter,
} from "./index";

describe("parseGraviolaUri", () => {
  test("parses type/id and view query", () => {
    expect(parseGraviolaUri("graviola:Person/person-1?view=chip")).toEqual({
      typeName: "Person",
      entityId: "person-1",
      view: "chip",
    });
  });
});

describe("parseWikilink", () => {
  test("parses type:id|label", () => {
    expect(parseWikilink("Person:person-1|Ada Lovelace")).toEqual({
      typeName: "Person",
      entityId: "person-1",
      label: "Ada Lovelace",
    });
  });

  test("parses view param", () => {
    expect(parseWikilink("Book:book-1|Graviola|view=card")).toEqual({
      typeName: "Book",
      entityId: "book-1",
      label: "Graviola",
      view: "card",
    });
  });
});

describe("serializeEntityRef round-trip", () => {
  test("uri syntax", () => {
    const ref = {
      typeName: "Person",
      entityId: "person-1",
      label: "Ada",
      view: "inline" as const,
    };
    const md = serializeEntityRef(ref, { syntax: "uri" });
    expect(md).toBe("[Ada](graviola:Person/person-1?view=inline)");
    expect(extractEntityRefs(md)).toHaveLength(1);
  });

  test("wikilink syntax", () => {
    const md = serializeEntityRef(
      { typeName: "Project", entityId: "p-1", label: "Demo" },
      { syntax: "wikilink" },
    );
    expect(md).toBe("[[Project:p-1|Demo]]");
    expect(extractEntityRefs(md)).toHaveLength(1);
  });
});

describe("frontmatter", () => {
  test("splits yaml header", () => {
    const doc = `---
baseIRI: http://example.org/
endpoint: http://localhost:7896
---
# Hello
`;
    const { frontmatter, body } = splitFrontmatter(doc);
    expect(frontmatter?.endpoint).toBe("http://localhost:7896");
    expect(body.trim()).toBe("# Hello");
    expect(stripFrontmatter(doc).trim()).toBe("# Hello");
  });
});

describe("parseEntityQuerySpec", () => {
  test("parses table query", () => {
    expect(
      parseEntityQuerySpec(`typeName: Person
view: table
limit: 10`),
    ).toEqual({ typeName: "Person", view: "table", limit: 10 });
  });

  test("parses nested table UI options", () => {
    expect(
      parseEntityQuerySpec(`typeName: Project
view: table
limit: 10
table:
  density: compact
  toolbar: hover
  width: auto
  selection: true`),
    ).toEqual({
      typeName: "Project",
      view: "table",
      limit: 10,
      table: {
        density: "compact",
        toolbar: "hover",
        width: "auto",
        selection: true,
      },
    });
  });
});

describe("resolveEntityIRI", () => {
  test("composes from type and id", () => {
    expect(
      resolveEntityIRI(
        { typeName: "Person", entityId: "person-1" },
        { entityBaseIRI: "http://example.org/kb/" },
      ),
    ).toBe("http://example.org/kb/Person/person-1");
  });
});
