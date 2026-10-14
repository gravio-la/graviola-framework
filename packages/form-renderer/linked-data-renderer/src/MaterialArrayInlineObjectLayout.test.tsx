import { beforeAll, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ControlElement, JsonSchema, Layout } from "@jsonforms/core";
import { Window } from "happy-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

import { MaterialArrayInlineObjectRenderer } from "./MaterialArrayInlineObjectRenderer";
import { MaterialLinkedObjectRenderer } from "./MaterialLinkedObjectRenderer";
import { materialLinkedObjectControlTester } from "./materialLinkedObjectControlTester";
import { materialArrayInlineObjectWithNestingTester } from "./materialArrayInlineObjectWithNestingTester";

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
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(
    join(fixtureDir, "test-fixtures/kochbuch-zutaten-trimmed.json"),
    "utf8",
  ),
) as {
  schema: JsonSchema;
  sideSchema: {
    entityBaseIRI: string;
    primaryFields: Record<string, { label: string }>;
    detailUiSchemaScopeOverrides: Record<
      string,
      { scopeOverride: Record<string, ControlElement> }
    >;
  };
};

const rootSchema = fixture.schema;
const rezeptWrapperSchema = rootSchema;

function zutatenControlFromGenerator(): ControlElement {
  const ui = generateDefaultUISchema(rezeptWrapperSchema, {
    rootSchema,
  }) as Layout;
  const control = ui.elements.find(
    (el) => (el as ControlElement).scope === "#/properties/zutaten",
  ) as ControlElement;
  if (!control) {
    throw new Error("expected zutaten control from generateDefaultUISchema");
  }
  const itemOverride =
    fixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
      ?.scopeOverride;
  return {
    ...control,
    options: {
      ...control.options,
      showSortButtons: true,
      itemScopeOverride: itemOverride,
    },
  };
}

const baseRenderers = [
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

function makeFormData() {
  return {
    zutaten: [
      {
        "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
        zutatRef: {
          "@id": "1eb3a7c6-4923-42e2-a8d3-5e0ae685da1a",
          "@type": "https://graviola.gra.one/models/kochbuch/Zutat",
          name: "Roggenmehl",
        },
        zutatFreitext: "",
        menge: "512",
        einheit: {
          "@id": "26324800-1385-43ae-9b2d-111111111111",
          "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
          name: "g",
        },
      },
      {
        "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
        zutatRef: {
          "@id": "2fa3b8d7-5924-53f3-b9e4-6f1bf796eb2b",
          "@type": "https://graviola.gra.one/models/kochbuch/Zutat",
          name: "Wasser",
        },
        menge: "72",
        einheit: {
          "@id": "36324800-1385-43ae-9b2d-222222222222",
          "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
          name: "ml",
        },
      },
      {
        "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
        zutatFreitext: "Salz",
        menge: "1",
        einheit: {
          "@id": "46324800-1385-43ae-9b2d-333333333333",
          "@type": "https://graviola.gra.one/models/kochbuch/Einheit",
          name: "Prise",
        },
      },
    ],
  };
}

beforeAll(() => {
  const win = new Window();
  const g = globalThis as typeof globalThis & Record<string, unknown>;
  g.document = win.document;
  g.window = win;
  g.navigator = win.navigator;
  g.HTMLElement = win.HTMLElement;
  g.Element = win.Element;
  g.Node = win.Node;
  g.MouseEvent = win.MouseEvent;
  g.IS_REACT_ACT_ENVIRONMENT = true;
});

async function renderForm(
  data: ReturnType<typeof makeFormData>,
  uischema: ControlElement,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <ThemeProvider theme={theme}>
        <JsonForms
          data={data}
          schema={rezeptWrapperSchema}
          uischema={{
            type: "VerticalLayout",
            elements: [uischema],
          }}
          renderers={baseRenderers}
          config={{
            primaryFields: fixture.sideSchema.primaryFields,
            entityBaseIRI: fixture.sideSchema.entityBaseIRI,
          }}
        />
      </ThemeProvider>,
    );
  });
  return { host, root };
}

function rowLabels(): string[] {
  return [...document.querySelectorAll(".MuiAccordion-root")].map(
    (row) => row.textContent ?? "",
  );
}

describe("MaterialArrayInlineObjectRenderer (kochbuch zutaten)", () => {
  test("collapsed labels use menge and never raw UUIDs; expand shows item fields", async () => {
    const uischema = zutatenControlFromGenerator();
    const { root } = await renderForm(makeFormData(), uischema);

    const labels = rowLabels();
    expect(labels.length).toBe(3);
    expect(labels[0]).toContain("512");
    expect(labels[0]).toContain("Roggenmehl");
    for (const label of labels) {
      expect(UUID_RE.test(label)).toBe(false);
    }

    const summaryActions = [
      ...document.querySelectorAll(".MuiAccordionSummary-root [role='button']"),
    ];
    expect(summaryActions.length).toBe(9);

    const upButtons = summaryActions.filter((el) =>
      (el.getAttribute("aria-label") ?? "").toLowerCase().includes("up"),
    );
    const downButtons = summaryActions.filter((el) =>
      (el.getAttribute("aria-label") ?? "").toLowerCase().includes("down"),
    );
    expect(upButtons.length).toBe(3);
    expect(downButtons.length).toBe(3);

    const summaries = document.querySelectorAll(".MuiAccordionSummary-root");
    for (const summary of summaries) {
      const section = summary.innerHTML;
      const buttonCount = (section.match(/<button/g) ?? []).length;
      expect(buttonCount).toBeLessThanOrEqual(1);
    }

    const firstSummary = summaries[0] as HTMLElement;
    await act(async () => {
      firstSummary.click();
    });
    expect(firstSummary.getAttribute("aria-expanded")).toBe("true");

    root.unmount();
  });

  test("preserves data order without orderBy", async () => {
    const uischema = zutatenControlFromGenerator();
    const { root } = await renderForm(makeFormData(), uischema);
    const labels = rowLabels();
    expect(labels[0]).toContain("512");
    expect(labels[1]).toContain("72");
    expect(labels[2]).toContain("Salz");
    root.unmount();
  });

  test("sorts display by options.orderBy while keeping move indices", async () => {
    const data = {
      zutaten: [
        {
          "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
          menge: "3",
          reihenfolge: 3,
          einheit: { name: "g" },
        },
        {
          "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
          menge: "1",
          reihenfolge: 1,
          einheit: { name: "g" },
        },
        {
          "@type": "https://graviola.gra.one/models/kochbuch/ZutatInRezept",
          menge: "2",
          reihenfolge: 2,
          einheit: { name: "g" },
        },
      ],
    };
    const uischema: ControlElement = {
      ...zutatenControlFromGenerator(),
      options: {
        ...zutatenControlFromGenerator().options,
        orderBy: { field: "reihenfolge", direction: "asc" },
      },
    };
    const { root } = await renderForm(data, uischema);
    const labels = rowLabels();
    expect(labels[0]).toContain("1");
    expect(labels[1]).toContain("2");
    expect(labels[2]).toContain("3");
    root.unmount();
  });
});
