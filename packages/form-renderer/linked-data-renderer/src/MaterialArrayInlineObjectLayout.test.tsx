import { beforeAll, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type {
  ControlElement,
  ControlProps,
  JsonSchema,
  Layout,
} from "@jsonforms/core";
import { rankWith, scopeEndsWith } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { Window } from "happy-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import React, { act } from "react";

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

const theme = createTheme({
  components: {
    MuiAccordion: {
      defaultProps: {
        TransitionProps: { timeout: 0 },
      },
    },
  },
});
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const trimmedFixture = JSON.parse(
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

const bundleFixture = JSON.parse(
  readFileSync(
    join(fixtureDir, "test-fixtures/kochbuch-rezept-from-bundle.json"),
    "utf8",
  ),
) as {
  schema: JsonSchema;
  rootSchema: JsonSchema;
  sideSchema: {
    entityBaseIRI: string;
    primaryFields: Record<string, { label: string }>;
    uischemaScopeOverrides?: Record<
      string,
      {
        mode?: "override" | "exclusive";
        scopeOverride?: Record<string, ControlElement>;
      }
    >;
    detailUiSchemaScopeOverrides: Record<
      string,
      { scopeOverride: Record<string, ControlElement> }
    >;
    orderBy?: Record<
      string,
      Record<string, { field: string; direction?: string }>
    >;
  };
};

const trimmedRootSchema = trimmedFixture.schema;

function zutatenControlFromGenerator(): ControlElement {
  const ui = generateDefaultUISchema(trimmedRootSchema, {
    rootSchema: trimmedRootSchema,
  }) as Layout;
  const control = ui.elements.find(
    (el) => (el as ControlElement).scope === "#/properties/zutaten",
  ) as ControlElement;
  if (!control) {
    throw new Error("expected zutaten control from generateDefaultUISchema");
  }
  const itemOverride =
    trimmedFixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
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

function rezeptFormUISchemaFromBundle(): Layout {
  const rezeptOverrides =
    bundleFixture.sideSchema.uischemaScopeOverrides?.Rezept;
  const ui = generateDefaultUISchema(bundleFixture.schema, {
    rootSchema: bundleFixture.rootSchema,
    scopeOverride: rezeptOverrides?.scopeOverride,
    mode: rezeptOverrides?.mode ?? "override",
    orderBy: bundleFixture.sideSchema.orderBy?.Rezept,
  }) as Layout;
  const zutatenIndex = ui.elements.findIndex(
    (el) => (el as ControlElement).scope === "#/properties/zutaten",
  );
  if (zutatenIndex < 0) {
    throw new Error("expected zutaten in Rezept form uischema");
  }
  const zutatenControl = ui.elements[zutatenIndex] as ControlElement;
  const itemOverride =
    bundleFixture.sideSchema.detailUiSchemaScopeOverrides.ZutatInRezept
      ?.scopeOverride;
  ui.elements[zutatenIndex] = {
    ...zutatenControl,
    options: {
      ...zutatenControl.options,
      showSortButtons: true,
      itemScopeOverride: itemOverride,
    },
  };
  return ui;
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

let e2eMengeChangeCount = 0;

/** Native input for menge — MUI TextField onChange does not wire under happy-dom. */
const MengeFieldForJsonFormsE2E = withJsonFormsControlProps(
  ({ data, path, handleChange, label }: ControlProps) => {
    const inputId = `graviola-e2e-menge-${path.replace(/\./g, "-")}`;
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    React.useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const onNativeChange = () => {
        e2eMengeChangeCount += 1;
        handleChange(path, el.value);
      };
      el.addEventListener("change", onNativeChange);
      el.addEventListener("input", onNativeChange);
      return () => {
        el.removeEventListener("change", onNativeChange);
        el.removeEventListener("input", onNativeChange);
      };
    }, [path, handleChange]);
    return (
      <div className="graviola-e2e-menge-control">
        <label htmlFor={inputId}>{label}</label>
        <input
          ref={inputRef}
          id={inputId}
          data-testid="graviola-e2e-menge-input"
          value={(data as string) ?? ""}
          onChange={(event) => {
            e2eMengeChangeCount += 1;
            handleChange(path, event.target.value);
          }}
        />
      </div>
    );
  },
);

const e2eRenderers = [
  {
    tester: rankWith(100, scopeEndsWith("/properties/menge")),
    renderer: MengeFieldForJsonFormsE2E,
  },
  ...baseRenderers,
];

function makeFormData() {
  return {
    "@type": "https://graviola.gra.one/models/kochbuch/Rezept",
    titel: "Roggen-Gelbkorn-Brot",
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
  g.Event = win.Event;
  g.InputEvent = win.InputEvent;
  g.IS_REACT_ACT_ENVIRONMENT = true;
});

async function renderForm(
  data: Record<string, unknown>,
  uischema: Layout | ControlElement,
  options?: {
    schema?: JsonSchema;
    rootSchema?: JsonSchema;
    sideSchema?: typeof trimmedFixture.sideSchema;
    onChange?: (data: Record<string, unknown>) => void;
    renderers?: typeof baseRenderers;
  },
) {
  const schema = options?.schema ?? trimmedRootSchema;
  const sideSchema = options?.sideSchema ?? trimmedFixture.sideSchema;
  const layout: Layout =
    uischema.type === "VerticalLayout"
      ? (uischema as Layout)
      : { type: "VerticalLayout", elements: [uischema as ControlElement] };

  function FormHarness() {
    const [formData, setFormData] = React.useState(data);
    return (
      <ThemeProvider theme={theme}>
        <JsonForms
          data={formData}
          schema={schema}
          uischema={layout}
          renderers={options?.renderers ?? baseRenderers}
          config={{
            primaryFields: sideSchema.primaryFields,
            entityBaseIRI: sideSchema.entityBaseIRI,
          }}
          onChange={({ data: next }) => {
            if (next) {
              setFormData(next as Record<string, unknown>);
              options?.onChange?.(next as Record<string, unknown>);
            }
          }}
        />
      </ThemeProvider>
    );
  }

  const view = render(<FormHarness />);
  return { view };
}

function rowLabels(): string[] {
  return [...document.querySelectorAll(".MuiAccordion-root")].map(
    (row) => row.textContent ?? "",
  );
}

describe("MaterialArrayInlineObjectRenderer (kochbuch zutaten)", () => {
  test("collapsed labels use menge and never raw UUIDs; expand shows item fields", async () => {
    e2eMengeChangeCount = 0;
    let latestData: Record<string, unknown> | undefined;
    const formUi = rezeptFormUISchemaFromBundle();
    const { view } = await renderForm(makeFormData(), formUi, {
      schema: bundleFixture.schema,
      rootSchema: bundleFixture.rootSchema,
      sideSchema: bundleFixture.sideSchema,
      renderers: e2eRenderers,
      onChange: (data) => {
        latestData = data;
      },
    });

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
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(firstSummary.getAttribute("aria-expanded")).toBe("true");

    const zutatenAccordion = [
      ...document.querySelectorAll(".MuiAccordion-root"),
    ].find((row) => (row.textContent ?? "").includes("512"));
    expect(zutatenAccordion).toBeTruthy();
    const panelText = zutatenAccordion!.textContent ?? "";
    expect(panelText).toContain("Menge");
    expect(panelText).toContain("Zutat (Freitext)");

    const mengeInput = zutatenAccordion!.querySelector(
      '[data-testid="graviola-e2e-menge-input"]',
    ) as HTMLInputElement | null;
    expect(mengeInput).toBeTruthy();

    fireEvent.change(mengeInput!, { target: { value: "600" } });
    expect(e2eMengeChangeCount).toBeGreaterThan(0);

    await waitFor(
      () => {
        const zutaten = latestData?.zutaten as { menge?: string }[] | undefined;
        expect(zutaten?.[0]?.menge).toBe("600");
      },
      { timeout: 200 },
    );

    view.unmount();
  });

  test("preserves data order without orderBy", async () => {
    const uischema = zutatenControlFromGenerator();
    const { view } = await renderForm(makeFormData(), uischema);
    const labels = rowLabels();
    expect(labels[0]).toContain("512");
    expect(labels[1]).toContain("72");
    expect(labels[2]).toContain("Salz");
    view.unmount();
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
    const { view } = await renderForm(data, uischema);
    const labels = rowLabels();
    expect(labels[0]).toContain("1");
    expect(labels[1]).toContain("2");
    expect(labels[2]).toContain("3");
    view.unmount();
  });
});
