import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { createUISchemata } from "./createUISchemata";

const kochbuchFragment: JSONSchema7 = {
  type: "object",
  definitions: {
    Zutat: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          type: "string",
          const: "https://graviola.gra.one/models/kochbuch/Zutat",
        },
        name: { type: "string" },
      },
    },
    ZutatInRezept: {
      type: "object",
      properties: {
        "@type": {
          type: "string",
          const: "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
        },
        zutatRef: { $ref: "#/definitions/Zutat" },
        menge: { type: "string" },
      },
    },
    Quelle: {
      type: "object",
      properties: {
        "@type": {
          type: "string",
          const: "https://graviola.gra.one/models/kochbuch/Quelle",
        },
        titel: { type: "string" },
      },
    },
  },
};

describe("createUISchemata", () => {
  test("registers entity stubs only for definitions with @id", () => {
    const { registry, uiSchemata } = createUISchemata(kochbuchFragment);

    expect(uiSchemata.Zutat).toBeDefined();
    expect(uiSchemata.ZutatInRezept).toBeUndefined();
    expect(uiSchemata.Quelle).toBeUndefined();

    const zutatType = kochbuchFragment.definitions!.Zutat as JSONSchema7;
    const zutatInRezeptType = kochbuchFragment.definitions!
      .ZutatInRezept as JSONSchema7;

    const zutatRank = registry
      .map((entry) => entry.tester(zutatType, undefined, undefined))
      .find((rank) => rank > -1);
    const anonymousRank = registry
      .map((entry) => entry.tester(zutatInRezeptType, undefined, undefined))
      .find((rank) => rank > -1);

    expect(zutatRank).toBe(10);
    expect(anonymousRank).toBeUndefined();
  });
});
