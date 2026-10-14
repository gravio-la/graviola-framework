import { beforeAll, describe, expect, it, mock } from "bun:test";
import { Window } from "happy-dom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  pickValueRenderer,
  imageUriTester,
} from "@graviola/edb-detail-renderer-core";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({}),
  useThumbnailUrl: (url?: string) => url,
}));

beforeAll(() => {
  const win = new Window();
  const g = globalThis as typeof globalThis & Record<string, unknown>;
  g.document = win.document;
  g.window = win;
  g.navigator = win.navigator;
  g.HTMLElement = win.HTMLElement;
  g.Element = win.Element;
  g.Node = win.Node;
});

const baseCtx: DetailTesterContext = {
  rootSchema: {},
  depth: 0,
  maxDepth: 6,
  viewSize: "detail",
};

async function renderIntoDom(node: React.ReactElement): Promise<HTMLElement> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(node);
    await new Promise((r) => setTimeout(r, 50));
  });
  return host;
}

describe("markdown value renderer", () => {
  it("tester ranks above fallback string", async () => {
    const { markdownValueTester } = await import("./markdownValueTester");
    const { defaultValueRenderers } = await import("./defaults");
    const testerCtx = { rootSchema: {}, config: { rootSchema: {} } };
    expect(markdownValueTester({}, { type: "string" }, testerCtx)).toBe(-1);
    expect(
      markdownValueTester(
        { type: "Control", scope: "#", options: { markdown: true } },
        { type: "string" },
        testerCtx,
      ),
    ).toBe(6);
    const stringEntry = defaultValueRenderers.find((e) => e.name === "string");
    expect(
      stringEntry?.tester(
        { type: "Control", scope: "#" },
        { type: "string" },
        testerCtx,
      ),
    ).toBe(1);
  });

  it("pickValueRenderer selects markdown renderer", async () => {
    const { defaultValueRenderers } = await import("./defaults");
    const schema = {
      type: "string" as const,
      contentMediaType: "text/markdown",
    };
    const ui = { type: "Control", scope: "#/properties/body" };
    const entry = pickValueRenderer(defaultValueRenderers, ui, schema, baseCtx);
    expect(entry?.name).toBe("markdown");
  });

  it("renders bold and external links", async () => {
    const { MarkdownValueRenderer } = await import("./MarkdownValueRenderer");
    const host = await renderIntoDom(
      <MarkdownValueRenderer
        value="**bold** and [link](https://example.org/x)"
        schema={{ type: "string" }}
        ctx={baseCtx}
      />,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2000));
    });
    const strong = host.querySelector("strong");
    expect(strong?.textContent).toBe("bold");
    const a = host.querySelector('a[href="https://example.org/x"]');
    expect(a).not.toBeNull();
    expect(a?.getAttribute("target")).toBe("_blank");
  });
});

describe("ImageValueRenderer in detail view", () => {
  it("imageUriTester matches image content type", () => {
    expect(
      imageUriTester(
        { type: "Control", scope: "#" },
        {
          type: "string",
          format: "uri",
          contentMediaType: "image/png",
        } as never,
        { rootSchema: {}, config: { rootSchema: {} } },
      ),
    ).toBe(5);
  });

  it("renders contained img instead of avatar for detail field values", async () => {
    const { ImageValueRenderer } = await import("./ImageValueRenderer");
    const host = await renderIntoDom(
      <ImageValueRenderer
        value="https://example.org/photo.jpg"
        schema={{
          type: "string",
          format: "uri",
          contentMediaType: "image/jpeg",
        }}
        ctx={baseCtx}
      />,
    );
    expect(host.querySelector("img")).not.toBeNull();
    expect(host.querySelector(".MuiAvatar-root")).toBeNull();
  });
});
