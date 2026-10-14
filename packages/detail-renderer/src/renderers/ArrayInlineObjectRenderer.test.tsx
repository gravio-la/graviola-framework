import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";
import {
  buildDispatch,
  generateDefaultDetailUISchema,
} from "@graviola/edb-detail-renderer-core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { JsonSchema } from "@jsonforms/core";

import { DetailRendererContext } from "../context";
import type { DetailRendererContextValue } from "../context";
import { ArrayInlineObjectRenderer } from "./ArrayInlineObjectRenderer";

const itemSchema = {
  type: "object" as const,
  properties: {
    reihenfolge: { type: "integer" as const },
    text: { type: "string" as const },
  },
};

const arraySchema = {
  type: "array" as const,
  items: itemSchema,
};

const data = [
  { reihenfolge: 12, text: "step-12" },
  { reihenfolge: 2, text: "step-2" },
  { reihenfolge: 1, text: "step-1" },
];

function textOrder(html: string): number[] {
  const re = /step-(\d+)/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push(Number(m[1]));
  }
  return out;
}

async function renderArrayInline(options?: Record<string, unknown>) {
  const { defaultDetailRenderers } = await import("./registries");
  const rootSchema = {
    type: "object" as const,
    properties: { steps: arraySchema },
  };
  const ctx: DetailTesterContext = {
    rootSchema,
    depth: 0,
    maxDepth: 8,
    valueRenderers: undefined,
  };
  const dispatch = buildDispatch(
    defaultDetailRenderers,
    rootSchema,
    { steps: data },
    ctx,
  );
  const uiSchema = {
    type: "Control",
    scope: "#/properties/steps",
    options,
  };

  return renderToStaticMarkup(
    <DetailRendererContext.Provider
      value={{
        registry: defaultDetailRenderers,
        config: {},
        rootSchema,
        rootData: { steps: data },
      }}
    >
      <ArrayInlineObjectRenderer
        label="Steps"
        schema={arraySchema}
        data={data}
        path={["steps"]}
        uiSchema={uiSchema}
        dispatch={dispatch}
        rootSchema={rootSchema}
        rootData={{ steps: data }}
        ctx={ctx}
      />
    </DetailRendererContext.Provider>,
  );
}

const zutatDef = {
  type: "object" as const,
  properties: {
    "@id": { type: "string" as const },
    "@type": { type: "string" as const },
    name: { type: "string" as const },
  },
};

const leafIngredientItemSchema = {
  type: "object" as const,
  properties: {
    zutatRef: { $ref: "#/definitions/Zutat" },
    zutatFreitext: { type: "string" as const },
    menge: { type: "number" as const },
    einheit: { type: "string" as const },
  },
};

const leafIngredientData = [
  {
    zutatRef: { "@id": "urn:z:1", "@type": "Zutat", name: "Mehl" },
    menge: 512,
    einheit: "g",
  },
  {
    zutatFreitext: "Salz",
    menge: 1,
    einheit: "Prise",
  },
];

function firstLeafRowHtml(html: string): string {
  const start = html.indexOf("data-inline-leaf-row");
  if (start < 0) return html;
  const nextRow = html.indexOf("data-inline-leaf-row", start + 1);
  return nextRow < 0 ? html.slice(start) : html.slice(start, nextRow);
}

function textIndexOrder(html: string, tokens: string[]): number[] {
  const row = firstLeafRowHtml(html);
  return tokens.map((t) => {
    const quoted = `>${t}<`;
    const viaQuote = row.indexOf(quoted);
    return viaQuote >= 0 ? viaQuote : row.indexOf(t);
  });
}

async function renderLeafIngredients(
  itemSchema: typeof leafIngredientItemSchema | { $ref: string },
  data: typeof leafIngredientData,
  contextExtras?: Partial<
    Pick<DetailRendererContextValue, "detailUiSchemata" | "orderBy">
  >,
  ctxExtras?: Partial<
    Pick<DetailTesterContext, "detailUiSchemata" | "orderBy">
  >,
  rootSchemaOverride?: Record<string, unknown>,
) {
  const { defaultDetailRenderers } = await import("./registries");
  const rootSchema = rootSchemaOverride ?? {
    type: "object" as const,
    definitions: { Zutat: zutatDef },
    properties: {
      zutaten: { type: "array" as const, items: itemSchema },
    },
  };
  const ctx: DetailTesterContext = {
    rootSchema: rootSchema as DetailTesterContext["rootSchema"],
    depth: 0,
    maxDepth: 8,
    valueRenderers: undefined,
    ...ctxExtras,
  };
  const dispatch = buildDispatch(
    defaultDetailRenderers,
    rootSchema,
    { zutaten: data },
    ctx,
  );
  const uiSchema = {
    type: "Control",
    scope: "#/properties/zutaten",
  };

  return renderToStaticMarkup(
    <DetailRendererContext.Provider
      value={{
        registry: defaultDetailRenderers,
        config: {},
        rootSchema,
        rootData: { zutaten: data },
        ...contextExtras,
      }}
    >
      <ArrayInlineObjectRenderer
        label="Zutaten"
        schema={{ type: "array", items: itemSchema }}
        data={data}
        path={["zutaten"]}
        uiSchema={uiSchema}
        dispatch={dispatch}
        rootSchema={rootSchema}
        rootData={{ zutaten: data }}
        ctx={ctx}
      />
    </DetailRendererContext.Provider>,
  );
}

describe("ArrayInlineObjectRenderer leaf-only inline row", () => {
  it("renders each leaf-only item values in one horizontal row without property labels", async () => {
    const html = await renderLeafIngredients(
      leafIngredientItemSchema,
      leafIngredientData,
    );
    expect(html.match(/data-inline-leaf-row/g)?.length).toBe(
      leafIngredientData.length,
    );
    expect(html).toContain("512");
    expect(html).toContain("Mehl");
    expect(html).not.toContain("zutatRef");
    expect(html).not.toContain("menge");
  });

  it("orders leaf-only values by class detail ranks when context uiSchemata provides them", async () => {
    const zutatInRezeptDef = { ...leafIngredientItemSchema };
    const rootSchema = {
      type: "object" as const,
      definitions: {
        Zutat: zutatDef,
        ZutatInRezept: zutatInRezeptDef,
      },
      properties: {
        zutaten: {
          type: "array" as const,
          items: { $ref: "#/definitions/ZutatInRezept" },
        },
      },
    };
    const detailUiSchemata = {
      ZutatInRezept: generateDefaultDetailUISchema(
        bringDefinitionToTop(
          rootSchema as never,
          "ZutatInRezept",
        ) as unknown as JsonSchema,
        {
          scopeOverride: {
            "#/properties/menge": { rank: 1 },
            "#/properties/einheit": { rank: 2 },
            "#/properties/zutatRef": { rank: 3 },
            "#/properties/zutatFreitext": { rank: 4 },
          },
        },
      ),
    };
    const rowData = [
      {
        zutatRef: { "@id": "urn:z:1", "@type": "Zutat", name: "Mehl" },
        menge: 512,
        einheit: "Gramm",
      },
    ];
    const html = await renderLeafIngredients(
      { $ref: "#/definitions/ZutatInRezept" },
      rowData,
      { detailUiSchemata },
      { detailUiSchemata },
      rootSchema,
    );
    const [i512, iEinheit, iMehl] = textIndexOrder(html, [
      "512",
      "Gramm",
      "Mehl",
    ]);
    expect(i512).toBeGreaterThan(-1);
    expect(iEinheit).toBeGreaterThan(-1);
    expect(iMehl).toBeGreaterThan(-1);
    expect(i512).toBeLessThan(iEinheit);
    expect(iEinheit).toBeLessThan(iMehl);
  });

  it("uses schema declaration order for leaf-only rows without class context", async () => {
    const rowData = [
      {
        zutatRef: { "@id": "urn:z:1", "@type": "Zutat", name: "Mehl" },
        menge: 512,
        einheit: "Gramm",
      },
    ];
    const html = await renderLeafIngredients(leafIngredientItemSchema, rowData);
    const [iMehl, i512, iEinheit] = textIndexOrder(html, [
      "Mehl",
      "512",
      "Gramm",
    ]);
    expect(iMehl).toBeLessThan(i512);
    expect(i512).toBeLessThan(iEinheit);
  });

  it("keeps block layout when an item property is markdown", async () => {
    const itemWithMarkdown = {
      ...leafIngredientItemSchema,
      properties: {
        ...leafIngredientItemSchema.properties,
        hinweis: { type: "string" as const, contentMediaType: "text/markdown" },
      },
    };
    const data = [
      {
        ...leafIngredientData[0],
        hinweis: "**note**",
      },
    ];
    const html = await renderLeafIngredients(itemWithMarkdown, data);
    expect(html).not.toContain("data-inline-leaf-row");
  });
});

describe("ArrayInlineObjectRenderer nested class orderBy", () => {
  it("sorts a nested array on inline items using context orderBy for the item class", async () => {
    const stepItem = {
      type: "object" as const,
      properties: {
        reihenfolge: { type: "integer" as const },
        text: { type: "string" as const },
      },
    };
    const lineItemDef = {
      type: "object" as const,
      properties: {
        label: { type: "string" as const },
        steps: { type: "array" as const, items: stepItem },
      },
    };
    const rootSchema = {
      type: "object" as const,
      definitions: { LineItem: lineItemDef },
      properties: {
        lines: {
          type: "array" as const,
          items: { $ref: "#/definitions/LineItem" },
        },
      },
    };
    const lineData = [
      {
        label: "A",
        steps: [
          { reihenfolge: 3, text: "step-3" },
          { reihenfolge: 1, text: "step-1" },
        ],
      },
    ];
    const { defaultDetailRenderers } = await import("./registries");
    const ctx: DetailTesterContext = {
      rootSchema,
      depth: 0,
      maxDepth: 8,
      orderBy: {
        LineItem: {
          steps: { field: "reihenfolge", direction: "asc" },
        },
      },
    };
    const dispatch = buildDispatch(
      defaultDetailRenderers,
      rootSchema,
      { lines: lineData },
      ctx,
    );
    const html = renderToStaticMarkup(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: { lines: lineData },
          orderBy: ctx.orderBy,
        }}
      >
        <ArrayInlineObjectRenderer
          label="Lines"
          schema={{ type: "array", items: { $ref: "#/definitions/LineItem" } }}
          data={lineData}
          path={["lines"]}
          uiSchema={{ type: "Control", scope: "#/properties/lines" }}
          dispatch={dispatch}
          rootSchema={rootSchema}
          rootData={{ lines: lineData }}
          ctx={ctx}
        />
      </DetailRendererContext.Provider>,
    );
    expect(textOrder(html)).toEqual([1, 3]);
  });
});

describe("ArrayInlineObjectRenderer orderBy", () => {
  it("keeps store order when options.orderBy is absent", async () => {
    const html = await renderArrayInline();
    expect(textOrder(html)).toEqual([12, 2, 1]);
  });

  it("sorts by options.orderBy for display", async () => {
    const html = await renderArrayInline({
      orderBy: { field: "reihenfolge", direction: "asc" },
    });
    expect(textOrder(html)).toEqual([1, 2, 12]);
  });

  it("shows numeric order badge and hides reihenfolge from item body", async () => {
    const html = await renderArrayInline({
      orderBy: { field: "reihenfolge", direction: "asc" },
    });
    expect(html).toContain('data-testid="order-badge"');
    expect(html.match(/order-badge/g)?.length).toBe(3);
    expect(html).not.toContain("reihenfolge");
  });
});
