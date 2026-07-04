import { describe, expect, test } from "bun:test";
import { defs } from "@graviola/json-schema-utils";
import { runPersonMappingDemo } from "./demo/mapPersonDemo";
import { schema } from "./schema";
import { typeIRItoTypeName } from "./typeIRItoTypeName";

describe("import-demo schema", () => {
  test("contains expected defs with recursive refs", () => {
    const definitionNames = Object.keys(defs(schema));
    expect(definitionNames.sort()).toEqual([
      "Corporation",
      "Exhibition",
      "Location",
      "Occupation",
      "Person",
      "Place",
    ]);

    const personDef = defs(schema).Person;
    expect(personDef.properties?.birthPlace?.$ref).toBe("#/$defs/Place");
    expect(personDef.properties?.profession?.items?.$ref).toBe(
      "#/$defs/Occupation",
    );

    expect(defs(schema).Place.properties?.location?.$ref).toBe(
      "#/$defs/Location",
    );
    expect(defs(schema).Place.properties?.parent?.$ref).toBe("#/$defs/Place");
    expect(defs(schema).Location.properties?.parent?.$ref).toBe(
      "#/$defs/Location",
    );
    expect(defs(schema).Occupation.properties?.parent?.$ref).toBe(
      "#/$defs/Occupation",
    );
  });

  test("typeIRItoTypeName resolves exhibition namespace IRIs", () => {
    expect(
      typeIRItoTypeName("http://ontologies.slub-dresden.de/exhibition#Person"),
    ).toBe("Person");
  });
});

describe("person fixture mapping (offline)", () => {
  test("creates nested person, birthplace, location chain, and occupations", async () => {
    const documents = await runPersonMappingDemo();
    const typeNames = documents.map((doc) => typeIRItoTypeName(doc["@type"]));

    expect(typeNames).toContain("Person");
    expect(typeNames).toContain("Place");
    expect(
      typeNames.filter((t) => t === "Location").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      typeNames.filter((t) => t === "Occupation").length,
    ).toBeGreaterThanOrEqual(1);

    const person = documents.find(
      (doc) => typeIRItoTypeName(doc["@type"]) === "Person",
    );
    expect(person?.name).toBe("Johann Wolfgang von Goethe");
    expect(person?.birthPlace).toBeDefined();
    expect(Array.isArray(person?.profession)).toBe(true);
    expect((person?.profession as unknown[]).length).toBeGreaterThanOrEqual(1);
  });
});
