import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ArrayPanelIconAction,
  GraviolaExpandPanelRendererComponent,
  resolveInlineArrayItemDisplayLabel,
} from "./SimpleExpandPanelRenderer";

describe("resolveInlineArrayItemDisplayLabel", () => {
  test("composes multi-prop inline ingredient labels", () => {
    expect(
      resolveInlineArrayItemDisplayLabel({
        index: 0,
        elementLabelProps: ["zutatRef", "zutatFreitext", "menge", "einheit"],
        data: {
          zutatRef: {
            label: "Roggenvollkornmehl",
            "@id": "http://example.org/z/1",
          },
          zutatFreitext: "",
          menge: 512,
          einheit: "g",
        },
      }),
    ).toBe("Roggenvollkornmehl 512 g");
  });

  test("falls back to Item N", () => {
    expect(
      resolveInlineArrayItemDisplayLabel({
        index: 2,
        data: {},
      }),
    ).toBe("Item 3");
  });
});

describe("GraviolaExpandPanelRendererComponent", () => {
  test("accordion summary does not nest button elements", () => {
    const html = renderToStaticMarkup(
      <GraviolaExpandPanelRendererComponent
        enabled
        index={0}
        path="zutaten"
        uischema={{
          type: "Control",
          scope: "#/properties/zutaten",
          options: { elementLabelProps: ["menge", "einheit"] },
        }}
        schema={{ type: "object" }}
        expanded={false}
        rootSchema={{ type: "object" }}
        enableMoveUp={false}
        enableMoveDown={false}
        config={{}}
        childLabelProp="menge"
        handleExpansion={() => () => {}}
        translations={{
          up: "Up",
          down: "Down",
          upAriaLabel: "Move up",
          downAriaLabel: "Move down",
          removeTooltip: "Remove",
          removeAriaLabel: "Remove",
          noDataMessage: "No data",
        }}
        childLabel="512 g"
        childPath="zutaten.0"
        removeItems={() => () => {}}
        moveUp={() => () => {}}
        moveDown={() => () => {}}
        disableRemove={false}
      />,
    );

    const summaryStart = html.indexOf("MuiAccordionSummary");
    const detailsStart = html.indexOf("MuiAccordionDetails");
    const summarySection = html.slice(summaryStart, detailsStart);
    expect((summarySection.match(/<button/g) ?? []).length).toBe(1);
    expect(summarySection.includes('role="button"')).toBe(true);
  });
});

describe("ArrayPanelIconAction", () => {
  test("renders span role button instead of IconButton", () => {
    const html = renderToStaticMarkup(
      <ArrayPanelIconAction ariaLabel="Remove" onActivate={() => {}}>
        x
      </ArrayPanelIconAction>,
    );
    expect(html.includes("<button")).toBe(false);
    expect(html.includes('role="button"')).toBe(true);
  });
});
