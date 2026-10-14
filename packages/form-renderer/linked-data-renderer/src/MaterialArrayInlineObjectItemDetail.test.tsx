import { describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { Resolve } from "@jsonforms/core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveInlineArrayItemDetailUISchema } from "./inlineArrayItemDetailUISchema";
import { MaterialArrayInlineObjectRenderer } from "./MaterialArrayInlineObjectRenderer";
import { MaterialLinkedObjectRenderer } from "./MaterialLinkedObjectRenderer";
import { materialArrayInlineObjectWithNestingTester } from "./materialArrayInlineObjectWithNestingTester";
import { materialLinkedObjectControlTester } from "./materialLinkedObjectControlTester";

mock.module("@graviola/edb-state-hooks", () => ({
  MODAL_ENTITY_DETAIL: "entity-detail",
  useAdbContext: () => ({
    queryBuildOptions: { primaryFields: {}, primaryFieldExtracts: {} },
    typePresentation: {},
    typeIRIToTypeName: (iri: string) => iri.split(/[#/]/).filter(Boolean).pop(),
  }),
  useCRUDWithQueryClient: () => ({
    saveMutation: { mutate: () => {}, isSuccess: true },
    loadQuery: { data: undefined },
  }),
  useGraviolaModal: () => ({ show: () => {} }),
  useThumbnailUrl: () => undefined,
}));

mock.module("next-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "de" }, t: (key: string) => key }),
}));

const theme = createTheme();
const fixtureDir = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(
    join(fixtureDir, "test-fixtures/kochbuch-zutaten-trimmed.json"),
    "utf8",
  ),
) as {
  schema: JsonSchema;
  sideSchema: {
    detailUiSchemaScopeOverrides: Record<
      string,
      { scopeOverride: Record<string, ControlElement> }
    >;
  };
};

const rootSchema = fixture.schema;
const renderers = [
  {
    tester: materialArrayInlineObjectWithNestingTester,
    renderer: MaterialArrayInlineObjectRenderer,
  },
  {
    tester: materialLinkedObjectControlTester,
    renderer: MaterialLinkedObjectRenderer,
  },
  ...materialRenderers,
];

describe("inline array item detail uischema", () => {
  test("renders ingredient item fields (Menge, Zutat Freitext) via JsonFormsDispatch", () => {
    const ui = generateDefaultUISchema(rootSchema, { rootSchema }) as Layout;
    const zutatenControl = ui.elements.find(
      (el) => (el as ControlElement).scope === "#/properties/zutaten",
    ) as ControlElement;
    const arraySchema = rootSchema.properties!.zutaten as JsonSchema;
    const itemOverride =
      fixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
        ?.scopeOverride;
    const arrayControl: ControlElement = {
      ...zutatenControl,
      options: {
        ...zutatenControl.options,
        itemScopeOverride: itemOverride,
      },
    };

    const detailUi = resolveInlineArrayItemDetailUISchema({
      arraySchema,
      arrayControl,
      rootSchema,
      path: "zutaten.0",
    });

    const itemSchema = Resolve.schema(
      arraySchema,
      "items",
      rootSchema,
    ) as JsonSchema;
    const itemRootSchema = bringDefinitionToTop(
      rootSchema,
      "ZutatInRezept",
    ) as JsonSchema;

    const itemData = {
      "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
      zutatRef: {
        "@id": "1eb3a7c6-4923-42e2-a8d3-5e0ae685da1a",
        "@type": "https://graviola.gra.one/models/kochbuch/Zutat",
        name: "Roggenmehl",
      },
      zutatFreitext: "optional",
      menge: "512",
      einheit: {
        "@id": "26324800-1385-43ae-9b2d-111111111111",
        "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
        name: "g",
      },
    };

    const html = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <JsonForms
          data={{ zutaten: [itemData] }}
          schema={rootSchema}
          uischema={{
            type: "VerticalLayout",
            elements: [arrayControl],
          }}
          renderers={renderers}
          config={{
            primaryFields: { Zutat: { label: "name" } },
          }}
        />
      </ThemeProvider>,
    );

    const itemHtml = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <JsonForms
          data={itemData}
          schema={itemRootSchema}
          uischema={detailUi}
          renderers={renderers}
        />
      </ThemeProvider>,
    );

    expect(itemHtml).toContain("Menge");
    expect(itemHtml).toContain("Zutat (Freitext)");
    expect(itemHtml).toMatch(/input|textarea/i);
    expect(html).toContain("512");
  });
});
