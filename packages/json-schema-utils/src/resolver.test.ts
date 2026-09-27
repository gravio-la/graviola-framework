import { describe, expect, test } from "bun:test";

import { JsonSchema, resolveSchema } from "./resolver";

describe("resolveSchema", () => {
  test("resolves #/properties/name on a plain object schema", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    expect(resolveSchema(schema, "#/properties/name", schema)).toEqual({
      type: "string",
    });
  });

  test("follows a $ref to a definition", () => {
    const rootSchema: JsonSchema = {
      definitions: {
        Name: { type: "string" },
      },
      type: "object",
      properties: {
        name: { $ref: "#/definitions/Name" },
      },
    };

    expect(resolveSchema(rootSchema, "#/properties/name", rootSchema)).toEqual({
      type: "string",
    });

    expect(
      resolveSchema(rootSchema.properties!.name as JsonSchema, "", rootSchema),
    ).toEqual({ type: "string" });
  });

  test("recursive but finite: Person.knows → #/definitions/Person", () => {
    const rootSchema: JsonSchema = {
      definitions: {
        Person: {
          type: "object",
          properties: {
            name: { type: "string" },
            knows: { $ref: "#/definitions/Person" },
          },
        },
      },
    };

    const personSchema = resolveSchema(
      rootSchema,
      "#/definitions/Person",
      rootSchema,
    );
    expect(personSchema).toBeDefined();

    const knowsSchema = resolveSchema(
      personSchema!,
      "#/properties/knows",
      rootSchema,
    );
    expect(knowsSchema?.properties?.name).toEqual({ type: "string" });

    const nameSchema = resolveSchema(
      personSchema!,
      "#/properties/knows/properties/name",
      rootSchema,
    );
    expect(nameSchema).toEqual({ type: "string" });
  });

  test("cycle A→B→A returns undefined and doesn't throw", () => {
    const rootSchema: JsonSchema = {
      definitions: {
        A: { $ref: "#/definitions/B" },
        B: { $ref: "#/definitions/A" },
      },
    };

    expect(() =>
      resolveSchema(rootSchema, "#/definitions/A", rootSchema),
    ).not.toThrow();
    expect(
      resolveSchema(rootSchema, "#/definitions/A", rootSchema),
    ).toBeUndefined();
  });

  test("self-cycle A: { $ref: '#/definitions/A' } returns undefined", () => {
    const rootSchema: JsonSchema = {
      definitions: {
        A: { $ref: "#/definitions/A" },
      },
    };

    expect(() =>
      resolveSchema(rootSchema, "#/definitions/A", rootSchema),
    ).not.toThrow();
    expect(
      resolveSchema(rootSchema, "#/definitions/A", rootSchema),
    ).toBeUndefined();
  });

  test("combinator fallback: property declared only inside allOf is found", () => {
    const rootSchema: JsonSchema = {
      type: "object",
      allOf: [
        {
          type: "object",
          properties: {
            x: { type: "number" },
          },
        },
      ],
    };

    expect(resolveSchema(rootSchema, "#/properties/x", rootSchema)).toEqual({
      type: "number",
    });
  });

  test("a property literally named oneOf is not treated as a combinator", () => {
    const rootSchema: JsonSchema = {
      type: "object",
      properties: {
        oneOf: { type: "string", title: "not a combinator" },
      },
    };

    expect(resolveSchema(rootSchema, "#/properties/oneOf", rootSchema)).toEqual(
      { type: "string", title: "not a combinator" },
    );
  });
});
