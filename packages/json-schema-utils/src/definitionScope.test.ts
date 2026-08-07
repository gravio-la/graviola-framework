import { describe, expect, it } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  definitionNameFromRef,
  definitionNameFromScope,
  definitionPropertyScope,
  definitionScope,
} from "./definitionScope";

describe("definitionNameFromScope", () => {
  it("reads definitions and $defs entity scopes", () => {
    expect(definitionNameFromScope("#/definitions/Plot")).toBe("Plot");
    expect(definitionNameFromScope("#/$defs/Plot")).toBe("Plot");
  });

  it("reads property scopes under either key", () => {
    expect(
      definitionNameFromScope("#/definitions/Plot/properties/width_m"),
    ).toBe("Plot");
    expect(definitionNameFromScope("#/$defs/Patch/properties/plots")).toBe(
      "Patch",
    );
  });

  it("returns undefined for non-definition scopes", () => {
    expect(definitionNameFromScope("#/properties/name")).toBeUndefined();
    expect(definitionNameFromScope(undefined)).toBeUndefined();
  });
});

describe("definitionScope / definitionPropertyScope", () => {
  it("defaults to definitions", () => {
    expect(definitionScope("Garden")).toBe("#/definitions/Garden");
    expect(definitionPropertyScope("Garden", "annual_fee")).toBe(
      "#/definitions/Garden/properties/annual_fee",
    );
  });

  it("honours explicit $defs key and schema document key", () => {
    expect(definitionScope("Garden", "$defs")).toBe("#/$defs/Garden");
    const schema: JSONSchema7 = {
      $defs: { Garden: { type: "object" } },
    };
    expect(definitionScope("Garden", schema)).toBe("#/$defs/Garden");
  });
});

describe("definitionNameFromRef", () => {
  it("parses both vocabulary keys", () => {
    expect(definitionNameFromRef("#/definitions/Tag")).toBe("Tag");
    expect(definitionNameFromRef("#/$defs/Tag")).toBe("Tag");
  });
});
