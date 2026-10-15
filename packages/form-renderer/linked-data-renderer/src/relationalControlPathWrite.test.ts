import { describe, expect, test } from "bun:test";
import Ajv from "ajv";
import {
  clearLinkedEntityAtPath,
  resolveAcceptedLinkedEntityLabel,
  writeLinkedEntitySelection,
} from "./relationalControlPathWrite";

describe("relationalControlPathWrite", () => {
  test("resolveAcceptedLinkedEntityLabel loads entity when payload has no label", async () => {
    const result = await resolveAcceptedLinkedEntityLabel({
      entityIRI: "http://example.org/z/new",
      acceptedData: {},
      typeName: "Zutat",
      primaryFields: { Zutat: { label: "name" } },
      loadEntity: async () => ({
        "@id": "http://example.org/z/new",
        name: "Geladen",
      }),
    });
    expect(result.label).toBe("Geladen");
  });

  test("uses name as label key when primaryFields is missing (Einheit)", () => {
    const changes: Array<[string, unknown]> = [];
    writeLinkedEntitySelection(
      (p, v) => changes.push([p, v]),
      "zutaten.0.einheit.@id",
      "https://example.org/Einheit",
      "name",
      { value: "26324800-1385-43ae-9b2d-111111111111", label: "g" },
      { typeName: "Einheit", primaryFields: {} },
    );
    expect(changes[0]?.[1]).toEqual({
      "@id": "26324800-1385-43ae-9b2d-111111111111",
      "@type": "https://example.org/Einheit",
      name: "g",
    });
  });

  test("writes full parent object for @id-scoped controls", () => {
    const changes: Array<[string, unknown]> = [];
    const handleChange = (p: string, v: unknown) => {
      changes.push([p, v]);
    };
    writeLinkedEntitySelection(
      handleChange,
      "zutaten.0.zutatRef.@id",
      "http://example.org/Zutat",
      "name",
      { value: "http://example.org/z/1", label: "Zucker" },
    );
    expect(changes).toEqual([
      [
        "zutaten.0.zutatRef",
        {
          "@id": "http://example.org/z/1",
          "@type": "http://example.org/Zutat",
          name: "Zucker",
        },
      ],
    ]);
  });

  test("clearing @id-scoped control clears the parent object", () => {
    const changes: Array<[string, unknown]> = [];
    clearLinkedEntityAtPath(
      (p, v) => changes.push([p, v]),
      "standardEinheit.@id",
    );
    expect(changes).toEqual([["standardEinheit", undefined]]);
  });

  test("parent object satisfies nested @id string schema", () => {
    const schema = {
      type: "object",
      properties: {
        zutatRef: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { type: "string" },
            name: { type: "string" },
          },
          required: ["@id"],
        },
      },
    };
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    let data: Record<string, unknown> = {
      zutatRef: {
        "@id": "http://example.org/z/old",
        "@type": "http://example.org/Zutat",
        name: "Alt",
      },
    };
    writeLinkedEntitySelection(
      (path, value) => {
        const parts = path.split(".");
        let cur: Record<string, unknown> = data;
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur[parts[i]!] as Record<string, unknown>;
        }
        cur[parts.at(-1)!] = value;
      },
      "zutatRef.@id",
      "http://example.org/Zutat",
      "name",
      { value: "http://example.org/z/new", label: "Neu" },
    );
    const ok = validate(data);
    expect(ok).toBe(true);
    expect(validate.errors ?? []).toEqual([]);
    expect(data.zutatRef).toEqual({
      "@id": "http://example.org/z/new",
      "@type": "http://example.org/Zutat",
      name: "Neu",
    });
  });
});
