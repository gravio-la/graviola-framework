import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

import { ObjectRenderer } from "./ObjectRenderer";

describe("ObjectRenderer", () => {
  it("does not warn about missing React keys on dispatched children", () => {
    const schema = {
      type: "object" as const,
      properties: {
        alpha: { type: "string" as const },
        beta: { type: "number" as const },
      },
    };
    const ctx: DetailTesterContext = {
      rootSchema: schema,
      depth: 1,
      viewSize: "detail",
      maxDepth: 8,
    };
    const uiSchema = { type: "Control", scope: "#" };
    const keyWarnings: string[] = [];
    const prevError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = args.map(String).join(" ");
      if (msg.includes("unique key")) keyWarnings.push(msg);
      prevError(...args);
    };
    try {
      renderToStaticMarkup(
        <ObjectRenderer
          label="Group"
          schema={schema}
          data={{ alpha: "a", beta: 1 }}
          path={[]}
          uiSchema={uiSchema}
          dispatch={() => <span>value</span>}
          rootSchema={schema}
          rootData={{ alpha: "a", beta: 1 }}
          ctx={ctx}
        />,
      );
    } finally {
      console.error = prevError;
    }
    expect(keyWarnings).toEqual([]);
  });
});
