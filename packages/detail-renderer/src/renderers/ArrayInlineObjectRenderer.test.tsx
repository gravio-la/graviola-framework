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
