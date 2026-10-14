import { describe, expect, test } from "bun:test";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { JSONSchema7 } from "json-schema";
import { renderToStaticMarkup } from "react-dom/server";

import { MaterialArrayInlineObjectRenderer } from "./MaterialArrayInlineObjectRenderer";
import { materialArrayInlineObjectWithNestingTester } from "./materialArrayInlineObjectWithNestingTester";

const theme = createTheme();

const zutatDef: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    name: { type: "string" },
  },
};

const rootSchema: JSONSchema7 = {
  type: "object",
  definitions: { Zutat: zutatDef },
  properties: {
    zutaten: {
      type: "array",
      items: {
        type: "object",
        properties: {
          zutatRef: { $ref: "#/definitions/Zutat" },
          zutatFreitext: { type: "string" },
          menge: { type: "number" },
          einheit: { type: "string" },
        },
      },
    },
  },
};

const formData = {
  zutaten: [
    {
      zutatRef: {
        "@id": "urn:z:1",
        label: "Roggenvollkornmehl",
        name: "Roggenvollkornmehl",
      },
      zutatFreitext: "",
      menge: 512,
      einheit: "g",
    },
  ],
};

describe("MaterialArrayInlineObjectRenderer", () => {
  test("collapsed label composes elementLabelProps and avoids nested buttons", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <JsonForms
          data={formData}
          schema={rootSchema}
          uischema={{
            type: "Control",
            scope: "#/properties/zutaten",
            options: {
              detail: { type: "VerticalLayout", elements: [] },
              elementLabelProps: [
                "zutatRef",
                "zutatFreitext",
                "menge",
                "einheit",
              ],
            },
          }}
          renderers={[
            {
              tester: materialArrayInlineObjectWithNestingTester,
              renderer: MaterialArrayInlineObjectRenderer,
            },
            ...materialRenderers,
          ]}
        />
      </ThemeProvider>,
    );

    expect(html).toContain("Roggenvollkornmehl 512 g");

    const summaryStart = html.indexOf("MuiAccordionSummary");
    const detailsStart = html.indexOf("MuiAccordionDetails");
    expect(summaryStart).toBeGreaterThan(-1);
    expect(detailsStart).toBeGreaterThan(summaryStart);
    const summarySection = html.slice(summaryStart, detailsStart);
    expect((summarySection.match(/<button/g) ?? []).length).toBe(1);
    expect(html.includes("<button><button")).toBe(false);
  });
});
