import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";
import { buildDispatch } from "@graviola/edb-detail-renderer-core";

import { DetailRendererContext } from "../context";
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

async function renderLeafIngredients(
  itemSchema: typeof leafIngredientItemSchema,
  data: typeof leafIngredientData,
) {
  const { defaultDetailRenderers } = await import("./registries");
  const rootSchema = {
    type: "object" as const,
    definitions: { Zutat: zutatDef },
    properties: {
      zutaten: { type: "array" as const, items: itemSchema },
    },
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
