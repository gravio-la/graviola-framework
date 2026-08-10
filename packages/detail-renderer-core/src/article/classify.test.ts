import { describe, expect, test } from "bun:test";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import {
  classifyPropertyControl,
  classifyResolvedSchema,
  isSectionWorthyObjectSchema,
  partitionArticleElements,
} from "./classify";
import {
  childArticleContext,
  headingTokenForLevel,
  readArticleOptions,
  rootArticleContext,
} from "./heading";
import type { DetailTesterContext } from "../types";

const rootSchema: JSONSchema7 = {
  type: "object",
  properties: {
    title: { type: "string" },
    count: { type: "integer" },
    owner: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
      },
    },
    notes: {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "string" },
      },
    },
  },
};

describe("classifyResolvedSchema", () => {
  test("primitives are literals", () => {
    expect(classifyResolvedSchema({ type: "string" }, false)).toBe("literal");
    expect(classifyResolvedSchema({ type: "integer" }, false)).toBe("literal");
  });

  test("entity-like objects are sections", () => {
    expect(
      classifyResolvedSchema(
        {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { type: "string" },
          },
        },
        false,
      ),
    ).toBe("object");
  });

  test("relationVia forces object", () => {
    expect(classifyResolvedSchema({ type: "string" }, true)).toBe("object");
  });

  test("small inline objects stay literal under threshold", () => {
    expect(
      isSectionWorthyObjectSchema({
        type: "object",
        properties: { a: { type: "string" }, b: { type: "string" } },
      }),
    ).toBe(false);
  });
});

describe("partitionArticleElements", () => {
  test("splits labels, literals, and objects", () => {
    const elements: UISchemaElement[] = [
      { type: "Label", text: "Intro" } as UISchemaElement,
      {
        type: "Control",
        scope: "#/properties/title",
      } as ControlElement,
      {
        type: "Control",
        scope: "#/properties/owner",
      } as ControlElement,
    ];
    const { labels, literals, objects } = partitionArticleElements(
      elements,
      rootSchema,
    );
    expect(labels).toHaveLength(1);
    expect(literals).toHaveLength(1);
    expect((literals[0] as ControlElement).scope).toBe("#/properties/title");
    expect(objects).toHaveLength(1);
  });

  test("classifyPropertyControl uses the same resolver as partition", () => {
    const control = {
      type: "Control",
      scope: "#/properties/count",
    } as ControlElement;
    expect(classifyPropertyControl(control, rootSchema)).toBe("literal");
  });
});

describe("heading / article options", () => {
  test("headingTokenForLevel clamps", () => {
    expect(headingTokenForLevel(2).component).toBe("h2");
    expect(headingTokenForLevel(1).component).toBe("h2");
    expect(headingTokenForLevel(9).component).toBe("h6");
  });

  test("readArticleOptions always returns a fresh object", () => {
    const parent: DetailTesterContext = {
      rootSchema: {},
      depth: 0,
      maxDepth: 6,
      article: { infoBox: "aside" },
    };
    const ui = { type: "VerticalLayout", options: {} } as UISchemaElement;
    const merged = readArticleOptions(ui, parent);
    expect(merged).toEqual({ infoBox: "aside" });
    merged.infoBox = "block";
    expect(parent.article?.infoBox).toBe("aside");
  });

  test("childArticleContext increments heading level", () => {
    const root = rootArticleContext(
      { rootSchema: {}, depth: 0, maxDepth: 6 },
      { headingStartLevel: 2 },
    );
    expect(root.headingLevel).toBe(2);
    const child = childArticleContext(root);
    expect(child.headingLevel).toBe(3);
    expect(child.presentation).toBe("article");
  });
});
