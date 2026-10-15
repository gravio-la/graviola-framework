import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import React, { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { JsonForms } from "@jsonforms/react";
import { materialRenderers } from "@jsonforms/material-renderers";
import {
  rankWith,
  scopeEndsWith,
  type ControlElement,
  type JsonSchema,
} from "@jsonforms/core";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { AutocompleteSuggestion } from "@graviola/edb-core-types";

import {
  RelationalFieldRenderer,
  relationalFieldRendererTester,
} from "./RelationalFieldRenderer";

let relationalPreference: "dropdown" | "finder" | undefined;
let finderAccept: ((iri: string, data: { label?: string }) => void) | undefined;

mock.module("@graviola/edb-state-hooks", () => ({
  MODAL_EDIT_ENTITY: "edit-entity",
  MODAL_ENTITY_DETAIL: "entity-detail",
  useAdbContext: () => ({
    relationalInputDefault: undefined,
    queryBuildOptions: {
      primaryFields: {
        LinkedEntity: { label: "name" },
      },
      primaryFieldExtracts: {},
    },
    typeIRIToTypeName: () => "LinkedEntity",
    createEntityIRI: () => "http://example.org/new",
    prepareNewEntityDataFinal: (d: unknown) => d,
  }),
  resolveRelationalInputMode: (
    explicit: boolean | undefined,
    preference: "dropdown" | "finder" | undefined,
    appDefault?: "dropdown" | "finder",
  ) =>
    explicit === true
      ? "dropdown"
      : explicit === false
        ? "finder"
        : (preference ?? appDefault ?? "dropdown"),
  useRelationalInputPreference: () => {
    const [, force] = React.useReducer((x: number) => x + 1, 0);
    React.useEffect(() => {
      const l = () => force();
      listeners.add(l);
      return () => listeners.delete(l);
    }, []);
    return [
      relationalPreference ?? "dropdown",
      (m: "dropdown" | "finder") => {
        relationalPreference = m;
        listeners.forEach((fn) => fn());
      },
    ] as const;
  },
  useGlobalSearch: (sel: (s: { similarityFinderOpen: boolean }) => unknown) =>
    sel({ similarityFinderOpen: false }),
  useGlobalSearchWithHelper: () => ({
    path: "",
    searchString: "",
    handleSearchStringChange: () => {},
    handleMappedData: () => {},
    handleFocus: () => {},
    isActive: false,
    setTypeName: () => {},
    setPath: () => {},
  }),
  useSimilarityFinderModal: () => ({
    hideFinder: () => {},
    showFinder: (props: {
      onExistingEntityAccepted?: (
        iri: string,
        data: { label?: string },
      ) => void;
    }) => {
      finderAccept = props.onExistingEntityAccepted;
      return Promise.resolve();
    },
  }),
  useGraviolaModal: () => ({ show: () => Promise.resolve(undefined) }),
  useKeyEventForSimilarityFinder: () => () => {},
  useCRUDWithQueryClient: () => ({
    saveMutation: { mutate: () => {} },
    loadQuery: { data: undefined },
  }),
  useThumbnailUrl: () => undefined,
  useTypeIRIFromEntity: (_iri: string, typeIRI?: string) => typeIRI,
}));

const listeners = new Set<() => void>();

mock.module("next-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "de" },
    t: (_k: string, d?: string) => d ?? _k,
  }),
}));

mock.module("@graviola/edb-advanced-components", () => ({
  DiscoverAutocompleteInput: ({
    selected,
    onSelectionChange,
  }: {
    selected: AutocompleteSuggestion;
    onSelectionChange: (v: AutocompleteSuggestion | null) => void;
  }) => (
    <div data-testid="discover-autocomplete">
      {selected?.value ? (
        <span data-testid="discover-selected-label">{selected.label}</span>
      ) : (
        <button
          type="button"
          data-testid="discover-simulate-select"
          onClick={() =>
            onSelectionChange({
              value: "http://example.org/z/new",
              label: "Zucker",
            })
          }
        >
          pick
        </button>
      )}
    </div>
  ),
  EntityDetailListItem: ({ data }: { data?: Record<string, unknown> }) => (
    <div data-testid="entity-detail-list-item">
      {String(data?.name ?? data?.title ?? "")}
    </div>
  ),
}));

mock.module("@graviola/edb-basic-components", () => ({
  SearchbarWithFloatingButton: () => null,
}));

const TYPE_IRI = "http://example.org/LinkedEntity";
const ZUTAT_IRI = "http://example.org/z/existing";

const linkedRefSchema: JsonSchema = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string" },
    name: { type: "string" },
  },
  required: ["@id"],
};

const rootSchema: JsonSchema = {
  type: "object",
  properties: {
    zutatRef: linkedRefSchema,
    standardEinheit: linkedRefSchema,
  },
};

const inlineControl = (scope: string): ControlElement => ({
  type: "Control",
  scope,
  options: {
    inline: true,
    context: { typeIRI: TYPE_IRI },
  },
});

const scopes: Record<string, string> = {
  "zutatRef.@id": "#/properties/zutatRef/properties/@id",
  "standardEinheit.@id": "#/properties/standardEinheit/properties/@id",
};

const renderers = [
  { tester: relationalFieldRendererTester, renderer: RelationalFieldRenderer },
  { tester: rankWith(10, scopeEndsWith("@type")), renderer: () => null },
  ...materialRenderers,
];

const theme = createTheme();

function JsonFormsHarness({
  path,
  initialData,
}: {
  path: string;
  initialData: Record<string, unknown>;
}) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<unknown[]>([]);
  const scope = scopes[path];
  if (!scope) throw new Error(`unknown path ${path}`);
  return (
    <>
      <ThemeProvider theme={theme}>
        <JsonForms
          schema={rootSchema}
          uischema={{
            type: "VerticalLayout",
            elements: [inlineControl(scope)],
          }}
          data={data}
          renderers={renderers}
          onChange={({ data: d, errors: e }) => {
            setData(d as Record<string, unknown>);
            setErrors(e ?? []);
          }}
          config={{}}
        />
      </ThemeProvider>
      <pre data-testid="form-errors">{JSON.stringify(errors)}</pre>
      <pre data-testid="form-data">{JSON.stringify(data)}</pre>
    </>
  );
}

beforeAll(() => {
  const win = new Window();
  (globalThis as any).window = win;
  (globalThis as any).document = win.document;
  (globalThis as any).navigator = win.navigator;
  (globalThis as any).HTMLElement = win.HTMLElement;
});

beforeEach(() => {
  cleanup();
  relationalPreference = "dropdown";
  finderAccept = undefined;
});

describe("RelationalFieldRenderer JsonForms integration", () => {
  test("nested @id path shows existing label and writes parent object on select", async () => {
    const { getByTestId, queryByTestId } = render(
      <JsonFormsHarness
        path="zutatRef.@id"
        initialData={{
          zutatRef: {
            "@id": ZUTAT_IRI,
            "@type": TYPE_IRI,
            name: "Mehl",
          },
        }}
      />,
    );
    await waitFor(() => {
      expect(getByTestId("entity-detail-list-item").textContent).toContain(
        "Mehl",
      );
    });
    expect(queryByTestId("discover-autocomplete")).toBeNull();

    cleanup();
    relationalPreference = "dropdown";
    const empty = render(
      <JsonFormsHarness path="zutatRef.@id" initialData={{}} />,
    );
    act(() => {
      fireEvent.click(empty.getByTestId("discover-simulate-select"));
    });
    await waitFor(() => {
      const parsed = JSON.parse(
        empty.getByTestId("form-data").textContent ?? "{}",
      );
      expect(parsed.zutatRef).toEqual({
        "@id": "http://example.org/z/new",
        "@type": TYPE_IRI,
        name: "Zucker",
      });
      expect(
        JSON.parse(empty.getByTestId("form-errors").textContent ?? "[]"),
      ).toEqual([]);
    });
  });

  test("finder mode accepts selection with valid parent object", async () => {
    relationalPreference = "finder";
    const { getByTestId } = render(
      <JsonFormsHarness path="zutatRef.@id" initialData={{}} />,
    );
    const input = getByTestId("relational-field").querySelector("input");
    expect(input).toBeTruthy();
    act(() => {
      fireEvent.focus(input!);
      fireEvent.change(input!, { target: { value: "Zuc" } });
    });
    await waitFor(() => expect(finderAccept).toBeDefined());
    act(() => {
      finderAccept?.("http://example.org/z/new", { label: "Zucker" });
    });
    await waitFor(() => {
      const parsed = JSON.parse(getByTestId("form-data").textContent ?? "{}");
      expect(parsed.zutatRef).toEqual({
        "@id": "http://example.org/z/new",
        "@type": TYPE_IRI,
        name: "Zucker",
      });
      expect(
        JSON.parse(getByTestId("form-errors").textContent ?? "[]"),
      ).toEqual([]);
    });
  });

  test("root-level relational field uses dropdown select with valid data", async () => {
    relationalPreference = "dropdown";
    const { getByTestId, queryByTestId } = render(
      <JsonFormsHarness
        path="standardEinheit.@id"
        initialData={{
          standardEinheit: {
            "@id": ZUTAT_IRI,
            "@type": TYPE_IRI,
            name: "Gramm",
          },
        }}
      />,
    );
    await waitFor(() => {
      expect(getByTestId("entity-detail-list-item").textContent).toContain(
        "Gramm",
      );
    });
    expect(queryByTestId("discover-simulate-select")).toBeNull();

    cleanup();
    const empty = render(
      <JsonFormsHarness path="standardEinheit.@id" initialData={{}} />,
    );
    act(() => {
      fireEvent.click(empty.getByTestId("discover-simulate-select"));
    });
    await waitFor(() => {
      const parsed = JSON.parse(
        empty.getByTestId("form-data").textContent ?? "{}",
      );
      expect(parsed.standardEinheit).toEqual({
        "@id": "http://example.org/z/new",
        "@type": TYPE_IRI,
        name: "Zucker",
      });
      expect(
        JSON.parse(empty.getByTestId("form-errors").textContent ?? "[]"),
      ).toEqual([]);
    });
  });
});
