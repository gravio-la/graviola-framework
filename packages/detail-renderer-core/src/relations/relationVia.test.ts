import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import type { DetailRelationViaOptions } from "../types";
import { groupRelationVia, resolveQualifierProperties } from "./relationVia";

const ENTITY_A = {
  "@id": "http://example.org/Entity/A",
  "@type": "http://example.org/Entity",
  name: "Alpha",
};

const ENTITY_B = {
  "@id": "http://example.org/Entity/B",
  "@type": "http://example.org/Entity",
  name: "Beta",
};

const linkSchema: JSONSchema7 = {
  type: "object",
  properties: {
    target: { type: "object" },
    from: { type: "string", format: "date" },
    to: { type: "string", format: "date" },
    role: { type: "string" },
  },
};

describe("groupRelationVia", () => {
  test("groups multiple occurrences of the same target by @id", () => {
    const data = [
      { target: ENTITY_A, from: "2001-01-01", to: "2005-04-02" },
      { target: ENTITY_A, from: "2006-01-01", to: "2008-04-02" },
      { target: ENTITY_B, from: "2019-08-01" },
    ];
    const options: DetailRelationViaOptions = {
      target: "target",
      sortOccurrencesBy: "from",
    };

    const groups = groupRelationVia(data, options);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.targetIRI).toBe(ENTITY_A["@id"]);
    expect(groups[0]!.occurrences).toHaveLength(2);
    expect(groups[0]!.occurrences[0]!.item.from).toBe("2001-01-01");
    expect(groups[0]!.occurrences[1]!.item.from).toBe("2006-01-01");
    expect(groups[1]!.targetIRI).toBe(ENTITY_B["@id"]);
    expect(groups[1]!.occurrences).toHaveLength(1);
  });

  test("groups blank-node targets by content hash", () => {
    const inlineTarget = { name: "Anonymous" };
    const data = [
      { target: inlineTarget, from: "2010-01-01" },
      { target: { name: "Other" }, from: "2011-01-01" },
      { target: inlineTarget, from: "2012-01-01" },
    ];

    const groups = groupRelationVia(data, { target: "target" });

    expect(groups).toHaveLength(2);
    expect(groups[0]!.occurrences).toHaveLength(2);
    expect(groups[0]!.target).toEqual(inlineTarget);
  });

  test("groupByTarget false yields one group per item", () => {
    const data = [
      { target: ENTITY_A, from: "2001-01-01" },
      { target: ENTITY_A, from: "2006-01-01" },
    ];

    const groups = groupRelationVia(data, {
      target: "target",
      groupByTarget: false,
    });

    expect(groups).toHaveLength(2);
    expect(groups[0]!.occurrences).toHaveLength(1);
    expect(groups[1]!.occurrences).toHaveLength(1);
  });

  test("captures occurrenceIRI when intermediate node has @id", () => {
    const data = [
      {
        "@id": "http://example.org/Link/1",
        target: ENTITY_A,
        role: "member",
      },
    ];

    const groups = groupRelationVia(data, { target: "target" });

    expect(groups[0]!.occurrences[0]!.occurrenceIRI).toBe(
      "http://example.org/Link/1",
    );
  });
});

describe("resolveQualifierProperties", () => {
  test("defaults to all non-target, non-@ properties", () => {
    const props = resolveQualifierProperties(linkSchema, {
      target: "target",
    });

    expect(props).toEqual(["from", "to", "role"]);
  });

  test("respects explicit qualifierProperties", () => {
    const props = resolveQualifierProperties(linkSchema, {
      target: "target",
      qualifierProperties: ["from", "to"],
    });

    expect(props).toEqual(["from", "to"]);
  });
});
