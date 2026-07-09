import type { JSONSchema7 } from "json-schema";
import { cbdBoundaryScopes, isNamedEntityBoundaryAtScope } from "./cbdBoundary";

const schema: JSONSchema7 = {
  $id: "https://example.org/garden",
  definitions: {
    Garden: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        patch: { $ref: "#/definitions/Patch" },
      },
    },
    Patch: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        label: { type: "string" },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
          },
        },
      },
    },
  },
};

describe("cbdBoundary", () => {
  it("finds named-entity scopes with @id", () => {
    const scopes = cbdBoundaryScopes(schema);
    const pointerScopes = scopes.map((s) => s.scope);
    expect(pointerScopes).toContain("#/definitions/Garden");
    expect(pointerScopes).toContain("#/definitions/Patch");
    expect(pointerScopes.some((s) => s.includes("address"))).toBe(false);
  });

  it("isNamedEntityBoundaryAtScope", () => {
    expect(isNamedEntityBoundaryAtScope(schema, "#/definitions/Garden")).toBe(
      true,
    );
    expect(
      isNamedEntityBoundaryAtScope(
        schema,
        "#/definitions/Patch/properties/address",
      ),
    ).toBe(false);
  });
});
