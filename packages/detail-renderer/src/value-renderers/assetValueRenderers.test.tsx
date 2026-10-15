import { beforeAll, describe, expect, it, mock } from "bun:test";
import type { AssetService } from "@graviola/edb-core-types";
import { compileSchema } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { Window } from "happy-dom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  assetRefTester,
  pickValueRenderer,
  type DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";

const mockAssetService: AssetService = {
  enabled: true,
  isAssetRef: (v) => typeof v === "string" && v.includes("/assets/"),
  assetIdOf: () => "a1",
  thumbnailUrl: (ref, size) => {
    const cat =
      typeof size === "string"
        ? size
        : "sizeCategory" in (size as object)
          ? (size as { sizeCategory?: string }).sizeCategory
          : "card";
    return `https://example.org/thumb?size=${cat}&ref=${encodeURIComponent(String(ref))}`;
  },
  originalUrl: (ref) =>
    `https://example.org/original?ref=${encodeURIComponent(String(ref))}`,
  upload: async () => {
    throw new Error("not in test");
  },
  importFromUrl: async () => {
    throw new Error("not in test");
  },
  iriFor: () => "urn:asset",
};

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({ assetService: mockAssetService }),
  useAssetService: () => mockAssetService,
  useThumbnailUrl: (ref: unknown, size?: { sizeCategory?: string }) =>
    mockAssetService.thumbnailUrl(ref, size?.sizeCategory ?? "detail"),
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

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
      },
    },
    Document: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Document" },
        fileName: { type: "string" },
        contentSize: { type: "number" },
        encodingFormat: { type: "string" },
      },
    },
  },
};

function assetCtx(): DetailTesterContext {
  return {
    rootSchema,
    depth: 0,
    maxDepth: 6,
    viewSize: "detail",
    assetClasses: { Photo: "image", Document: "file" },
    schemaRegistry: compileSchema(rootSchema),
  };
}

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

describe("asset detail renderers", () => {
  it("pickValueRenderer selects asset value renderer", async () => {
    const { defaultValueRenderers } = await import("./defaults");
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Photo" },
      },
    };
    const ui = { type: "Control", scope: "#/properties/photo" };
    const entry = pickValueRenderer(
      defaultValueRenderers,
      ui,
      schema,
      assetCtx(),
    );
    expect(entry?.name).toBe("asset");
    expect(assetRefTester(ui, schema, { rootSchema, config: assetCtx() })).toBe(
      6,
    );
  });

  it("AssetValueRenderer image kind renders card thumbnail", async () => {
    const { AssetValueRenderer } = await import("./AssetValueRenderer");
    const iri = "https://ex.org/assets/photo-1";
    const host = await renderIntoDom(
      <AssetValueRenderer
        value={iri}
        schema={{
          type: "object",
          properties: {
            "@id": { type: "string" },
            "@type": { const: "https://ex.org/Photo" },
          },
        }}
        ctx={assetCtx()}
      />,
    );
    const src = host.querySelector("img")?.getAttribute("src") ?? "";
    expect(src.includes("/thumb?size=card")).toBe(true);
  });

  it("file kind renders download link to original", async () => {
    const { AssetValueRenderer } = await import("./AssetValueRenderer");
    const iri = "https://ex.org/assets/doc-1";
    const host = await renderIntoDom(
      <AssetValueRenderer
        value={{
          "@id": iri,
          fileName: "report.pdf",
          encodingFormat: "application/pdf",
          contentSize: 2048,
        }}
        schema={{
          type: "object",
          properties: { "@type": { const: "https://ex.org/Document" } },
        }}
        ctx={{
          ...assetCtx(),
          assetClasses: { Document: "file" },
        }}
      />,
    );
    const link = host.querySelector('a[href*="original"]');
    expect(link?.getAttribute("href")).toContain("/original");
  });

  it("gallery renders N images", async () => {
    const { AssetGalleryValueRenderer } =
      await import("./AssetGalleryValueRenderer");
    const iris = [
      "https://ex.org/assets/p1",
      "https://ex.org/assets/p2",
      "https://ex.org/assets/p3",
    ];
    const host = await renderIntoDom(
      <AssetGalleryValueRenderer
        label="Photos"
        data={iris}
        schema={{ type: "array", items: { type: "string" } }}
        path={["photos"]}
        uiSchema={{ type: "Control", scope: "#/properties/photos" }}
        dispatch={() => null}
        rootSchema={rootSchema}
        rootData={{}}
        ctx={assetCtx()}
      />,
    );
    expect(host.querySelectorAll("img").length).toBe(3);
  });
});
