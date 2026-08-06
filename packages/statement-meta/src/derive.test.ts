import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import { deriveProvenanceSchema, STATEMENT_DEFINITION } from "./index";

const itemSchema: JSONSchema7 = {
  definitions: {
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        name: { type: "string" },
        price: { type: "number" },
        billing: {
          type: "object",
          properties: {
            total: { type: "number" },
          },
        },
        category: { $ref: "#/definitions/Category" },
      },
    },
    Category: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
      },
    },
  },
};

describe("deriveProvenanceSchema", () => {
  test("grafts price__stmt for always policy", () => {
    const derived = deriveProvenanceSchema(itemSchema, undefined, {
      policies: { "Item.price": "always" },
    });
    const itemProps = derived.definitions?.Item?.properties as Record<
      string,
      JSONSchema7
    >;
    expect(itemProps.price__stmt).toBeDefined();
    expect(itemProps.price__stmt?.type).toBe("array");
    expect(itemProps.name__stmt).toBeUndefined();
    expect(derived.definitions?.[STATEMENT_DEFINITION]).toBeDefined();
    const stmtDef = derived.definitions?.[STATEMENT_DEFINITION] as JSONSchema7;
    expect(stmtDef.properties?.["@id"]).toBeUndefined();
  });

  test("grafts nested billing.total", () => {
    const derived = deriveProvenanceSchema(itemSchema, undefined, {
      policies: { "Item.billing.total": "always" },
    });
    const billing = (
      derived.definitions?.Item?.properties?.billing as JSONSchema7
    )?.properties as Record<string, JSONSchema7>;
    expect(billing.total__stmt).toBeDefined();
  });

  test("does not graft via $ref referrer for Category", () => {
    const derived = deriveProvenanceSchema(itemSchema, undefined, {
      policies: { "Category.name": "always", "Item.price": "always" },
    });
    const itemProps = derived.definitions?.Item?.properties as Record<
      string,
      JSONSchema7
    >;
    expect(itemProps.category__stmt).toBeUndefined();
    const catProps = derived.definitions?.Category?.properties as Record<
      string,
      JSONSchema7
    >;
    expect(catProps.name__stmt).toBeDefined();
  });
});
