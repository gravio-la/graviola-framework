import { beforeAll, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

import { writeLinkedEntitySelection } from "../../../form-renderer/linked-data-renderer/src/relationalControlPathWrite";
import kochbuchFixture from "../../../form-renderer/linked-data-renderer/src/test-fixtures/kochbuch-rezept-from-bundle.json";

const ZUTAT_TYPE = "https://graviola.gra.one/models/kochbuch/Zutat";
const EINHEIT_TYPE = "https://graviola.gra.one/models/kochbuch/Einheit";

const EINHEIT_G = "https://graviola.gra.one/models/kochbuch/Einheit/g";
const EINHEIT_EL = "https://graviola.gra.one/models/kochbuch/Einheit/el";
const ZUTAT_TOMATE = "https://graviola.gra.one/models/kochbuch/Zutat/tomate";

const derivedDefaultsConfig = {
  ZutatInRezept: {
    einheit: { path: ["zutatRef", "standardEinheit"] },
  },
};

const typeIRIToTypeName = (iri: string) => {
  if (iri.includes("/Einheit")) return "Einheit";
  if (iri.includes("/ZutatInRezept")) return "ZutatInRezept";
  if (iri.includes("/Zutat")) return "Zutat";
  if (iri.includes("/Rezept")) return "Rezept";
  return undefined;
};

const docs: Record<string, Record<string, unknown>> = {
  [ZUTAT_TOMATE]: {
    "@id": ZUTAT_TOMATE,
    "@type": "https://graviola.gra.one/models/kochbuch/Zutat",
    name: "Tomate",
    standardEinheit: { "@id": EINHEIT_G },
  },
  [EINHEIT_G]: {
    "@id": EINHEIT_G,
    "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
    name: "Gramm",
  },
  [EINHEIT_EL]: {
    "@id": EINHEIT_EL,
    "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
    name: "EL",
  },
};

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({
    typeIRIToTypeName,
    derivedDefaults: derivedDefaultsConfig,
    queryBuildOptions: { primaryFields: { Einheit: { label: "name" } } },
  }),
  useDataStore: () => ({
    dataStore: {
      loadOne: async (_type: string, iri: string) => docs[iri] ?? null,
    },
    ready: true,
  }),
}));

const { useDerivedDefaults } = await import("./useDerivedDefaults");

describe("useDerivedDefaults", () => {
  beforeAll(() => {
    const window = new Window();
    globalThis.window = window as unknown as Window & typeof globalThis.window;
    globalThis.document = window.document;
  });

  test("fills einheit from Zutat.standardEinheit and respects manual override", async () => {
    const rootSchema = kochbuchFixture.schema as JSONSchema7;
    const schema = bringDefinitionToTop(
      rootSchema as never,
      "Rezept",
    ) as unknown as JSONSchema7;

    const latestDataRef = {
      current: { zutaten: [{}] } as Record<string, unknown>,
    };
    const changes: Record<string, unknown>[] = [];

    const { result } = renderHook(() =>
      useDerivedDefaults({
        schema,
        config: derivedDefaultsConfig,
        latestDataRef,
        onChange: (data) => {
          changes.push(data);
          latestDataRef.current = data;
        },
      }),
    );

    act(() => {
      const prev = { zutaten: [{}] };
      const next = {
        zutaten: [{ zutatRef: { "@id": ZUTAT_TOMATE } }],
      };
      latestDataRef.current = next;
      result.current.onUserChange(prev, next);
    });

    await waitFor(() =>
      expect(
        changes.some((c) => {
          const einheit = (
            c.zutaten as { einheit?: Record<string, unknown> }[]
          )?.[0]?.einheit;
          return (
            einheit?.["@id"] === EINHEIT_G &&
            einheit?.name === "Gramm" &&
            einheit?.["@type"] === EINHEIT_TYPE
          );
        }),
      ).toBe(true),
    );

    act(() => {
      const prev = latestDataRef.current;
      const next = {
        zutaten: [
          {
            zutatRef: { "@id": ZUTAT_TOMATE },
            einheit: { "@id": EINHEIT_EL },
          },
        ],
      };
      latestDataRef.current = next;
      result.current.onUserChange(prev, next);
    });

    const otherZutat = "https://graviola.gra.one/models/kochbuch/Zutat/other";
    docs[otherZutat] = {
      "@id": otherZutat,
      standardEinheit: { "@id": EINHEIT_G },
    };

    const countBefore = changes.length;
    act(() => {
      const prev = latestDataRef.current;
      const next = {
        zutaten: [
          {
            zutatRef: { "@id": otherZutat },
            einheit: { "@id": EINHEIT_EL },
          },
        ],
      };
      latestDataRef.current = next;
      result.current.onUserChange(prev, next);
    });

    await waitFor(() => Promise.resolve());
    expect(changes.length).toBe(countBefore);
    expect(
      (latestDataRef.current.zutaten as { einheit?: { "@id"?: string } }[])?.[0]
        ?.einheit,
    ).toEqual({ "@id": EINHEIT_EL });
  });

  test("fills einheit when zutatRef uses linked-data picker shape", async () => {
    const rootSchema = kochbuchFixture.schema as JSONSchema7;
    const schema = bringDefinitionToTop(
      rootSchema as never,
      "Rezept",
    ) as unknown as JSONSchema7;

    let pickerZutatRef: Record<string, unknown> | undefined;
    writeLinkedEntitySelection(
      (_path, value) => {
        pickerZutatRef = value as Record<string, unknown>;
      },
      "zutaten.0.zutatRef",
      ZUTAT_TYPE,
      "name",
      { value: ZUTAT_TOMATE, label: "Tomate" },
    );

    const latestDataRef = {
      current: { zutaten: [{}] } as Record<string, unknown>,
    };
    const changes: Record<string, unknown>[] = [];

    const { result } = renderHook(() =>
      useDerivedDefaults({
        schema,
        config: derivedDefaultsConfig,
        latestDataRef,
        onChange: (data) => {
          changes.push(data);
          latestDataRef.current = data;
        },
      }),
    );

    act(() => {
      const prev = { zutaten: [{}] };
      const next = {
        zutaten: [{ zutatRef: pickerZutatRef }],
      };
      latestDataRef.current = next;
      result.current.onUserChange(prev, next);
    });

    await waitFor(() =>
      expect(
        (
          latestDataRef.current.zutaten as {
            einheit?: Record<string, unknown>;
          }[]
        )?.[0]?.einheit,
      ).toEqual({
        "@id": EINHEIT_G,
        "@type": EINHEIT_TYPE,
        name: "Gramm",
      }),
    );
  });
});
