import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import {
  applyDerivedDefault,
  isAbsentValue,
  planDerivedDefaultJobs,
  pruneAutoFilledPaths,
  resolveDerivedPathValue,
  shouldApplyDerivedDefault,
} from "./derivedDefaults";

const schema: JSONSchema7 = {
  type: "object",
  properties: {
    zutaten: {
      type: "array",
      items: { $ref: "#/definitions/ZutatInRezept" },
    },
  },
  definitions: {
    Zutat: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          const: "https://example.org/Zutat",
          type: "string",
        },
        standardEinheit: { $ref: "#/definitions/Einheit" },
      },
    },
    Einheit: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          const: "https://example.org/Einheit",
          type: "string",
        },
        name: { type: "string" },
      },
    },
    ZutatInRezept: {
      type: "object",
      properties: {
        "@type": {
          const: "https://example.org/ZutatInRezept",
          type: "string",
        },
        zutatRef: { $ref: "#/definitions/Zutat" },
        einheit: { $ref: "#/definitions/Einheit" },
      },
    },
  },
};

const config = {
  ZutatInRezept: {
    einheit: { path: ["zutatRef", "standardEinheit"] },
  },
};

const classOf = (objectSchema: JSONSchema7 | undefined) => {
  const typeConst = objectSchema?.properties?.["@type"] as
    | JSONSchema7
    | undefined;
  if (typeConst?.const === "https://example.org/ZutatInRezept") {
    return "ZutatInRezept";
  }
  return undefined;
};

describe("isAbsentValue", () => {
  test("treats empty and stub values as absent", () => {
    expect(isAbsentValue(undefined)).toBe(true);
    expect(isAbsentValue(null)).toBe(true);
    expect(isAbsentValue("")).toBe(true);
    expect(isAbsentValue([])).toBe(true);
    expect(isAbsentValue({})).toBe(true);
    expect(isAbsentValue({ "@id": "x" })).toBe(false);
  });
});

describe("shouldApplyDerivedDefault", () => {
  test("allows fill when absent or still auto-filled", () => {
    expect(shouldApplyDerivedDefault(undefined, undefined)).toBe(true);
    expect(shouldApplyDerivedDefault({ "@id": "e1" }, { "@id": "e1" })).toBe(
      true,
    );
    expect(shouldApplyDerivedDefault({ "@id": "e2" }, { "@id": "e1" })).toBe(
      false,
    );
  });
});

describe("planDerivedDefaultJobs", () => {
  test("plans nested array item target path", () => {
    const prev = {
      zutaten: [{ zutatRef: { "@id": "z1" } }],
    };
    const next = {
      zutaten: [{ zutatRef: { "@id": "z2" } }],
    };
    const jobs = planDerivedDefaultJobs(prev, next, schema, config, classOf);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.targetPath).toBe("zutaten.0.einheit");
    expect(jobs[0]?.restPath).toEqual(["standardEinheit"]);
  });

  test("no job when source segment unchanged", () => {
    const data = { zutaten: [{ zutatRef: { "@id": "z1" } }] };
    expect(
      planDerivedDefaultJobs(data, data, schema, config, classOf),
    ).toHaveLength(0);
  });
});

describe("applyDerivedDefault", () => {
  test("immutable set at dot path", () => {
    const data = { zutaten: [{ einheit: undefined }] };
    const out = applyDerivedDefault(data, "zutaten.0.einheit", {
      "@id": "e1",
    });
    expect(out).not.toBe(data);
    expect(out.zutaten[0].einheit).toEqual({ "@id": "e1" });
  });
});

describe("pruneAutoFilledPaths", () => {
  test("drops path when user overrides auto value", () => {
    const autoFilled = new Map<string, unknown>([
      ["zutaten.0.einheit", { "@id": "e1" }],
    ]);
    const prev = { zutaten: [{ einheit: { "@id": "e1" } }] };
    const next = { zutaten: [{ einheit: { "@id": "e2" } }] };
    pruneAutoFilledPaths(prev, next, autoFilled);
    expect(autoFilled.has("zutaten.0.einheit")).toBe(false);
  });
});

describe("resolveDerivedPathValue", () => {
  test("loads bare references along the path", async () => {
    const docs: Record<string, Record<string, unknown>> = {
      z1: {
        "@id": "z1",
        standardEinheit: { "@id": "e1" },
      },
      e1: {
        "@id": "e1",
        name: "g",
      },
    };
    const value = await resolveDerivedPathValue({
      rootSchema: schema,
      ownerSchema: schema.definitions!.ZutatInRezept as JSONSchema7,
      sourceSegment: "zutatRef",
      firstValue: { "@id": "z1" },
      restPath: ["standardEinheit"],
      loadDocument: async (_type, iri) => docs[iri] ?? null,
      typeIRIToTypeName: (iri) => {
        if (iri.includes("Zutat")) return "Zutat";
        if (iri.includes("Einheit")) return "Einheit";
        return undefined;
      },
      cache: new Map(),
    });
    expect(value).toEqual({ "@id": "e1" });
  });

  test("returns undefined when path cannot be resolved", async () => {
    const value = await resolveDerivedPathValue({
      rootSchema: schema,
      ownerSchema: schema.definitions!.ZutatInRezept as JSONSchema7,
      sourceSegment: "zutatRef",
      firstValue: { "@id": "missing" },
      restPath: ["standardEinheit"],
      loadDocument: async () => null,
      typeIRIToTypeName: () => "Zutat",
      cache: new Map(),
    });
    expect(value).toBeUndefined();
  });
});
