import { describe, expect, it, mock } from "bun:test";
import { buildDispatch } from "@graviola/edb-detail-renderer-core";

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({}),
  useThumbnailUrl: (url?: string) => url,
}));
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

import { DetailSectionHeading } from "../components/DetailSectionHeading";
import { DetailIriFooter } from "../components/DetailIriFooter";
import { DetailMetaStrip } from "../components/DetailMetaStrip";
import { TopLevelLayoutRenderer } from "./layouts/TopLevelLayoutRenderer";
import { DetailHero } from "./layouts/DetailHero";
import { DetailHeroImage } from "../components/DetailHeroImage";
import { DetailRendererContext } from "../context";
import { PropertyRow } from "./PropertyRow";
import { DetailPresentationProvider } from "../detailPresentationContext";
import {
  detailContentMaxWidthSx,
  readDetailLayoutOptions,
} from "../utils/detailLayoutOptions";
import { groupTopLevelDetailElements } from "../utils/detailTopLevelElements";
import { shouldUseImagePlaceholder } from "../utils/imagePlaceholder";
import { isCompactLeafObjectSchema } from "../utils/detailSchemaPresentation";

const theme = createTheme();

function wrap(node: React.ReactElement) {
  return renderToStaticMarkup(
    <ThemeProvider theme={theme}>{node}</ThemeProvider>,
  );
}

const baseCtx: DetailTesterContext = {
  rootSchema: {
    type: "object",
    properties: {
      portionen: { type: "integer" },
      dauer: { type: "integer" },
      title: { type: "string" },
      quelle: {
        type: "object",
        properties: {
          art: { type: "string" },
          url: { type: "string", format: "uri" },
        },
      },
    },
  },
  depth: 0,
  maxDepth: 6,
  viewSize: "detail",
  entityIRI: "http://example.org/recipe/1",
  headerPrimaryFieldNames: ["title"],
};

describe("detail presentation", () => {
  it("DetailSectionHeading uses subtitle1 / h2", () => {
    const html = wrap(<DetailSectionHeading>Zutaten</DetailSectionHeading>);
    expect(html).toContain("Zutaten");
    expect(html).toMatch(/MuiTypography-subtitle1|variant="subtitle1"/);
    expect(html).toContain("h2");
  });

  it("detailContentMaxWidthSx defaults to 80ch centered", () => {
    expect(detailContentMaxWidthSx(undefined)).toEqual({
      maxWidth: "80ch",
      mx: "auto",
      width: "100%",
    });
    expect(detailContentMaxWidthSx("none")).toEqual({});
  });

  it("readDetailLayoutOptions defaults showIri to footer", () => {
    expect(readDetailLayoutOptions(undefined)).toEqual({ showIri: "footer" });
    expect(
      readDetailLayoutOptions({ detail: { maxWidth: "72ch" } }),
    ).toMatchObject({ maxWidth: "72ch", showIri: "footer" });
  });

  it("DetailHero omits IRI under title when showIri is footer", () => {
    const html = wrap(
      <DetailHero
        ctx={{
          ...baseCtx,
          headerPreview: { label: "Roggen", description: null, image: null },
        }}
        showIri="footer"
      />,
    );
    expect(html).toContain("Roggen");
    expect(html).not.toContain("http://example.org/recipe/1");
  });

  it("DetailIriFooter renders entity IRI at end", () => {
    const html = wrap(
      <DetailIriFooter entityIRI="http://example.org/recipe/1" />,
    );
    expect(html).toContain("http://example.org/recipe/1");
    expect(html).toMatch(/monospace|font-family/);
  });

  it("TopLevelLayoutRenderer applies maxWidth on detail content wrapper", () => {
    const uiSchema = {
      type: "TopLevelLayout",
      elements: [{ type: "Control", scope: "#/properties/quelle" }],
      options: { detail: { maxWidth: "80ch" } },
    };
    const html = wrap(
      <TopLevelLayoutRenderer
        uiSchema={uiSchema}
        schema={baseCtx.rootSchema}
        data={{ quelle: { art: "x", url: "https://a.b" } }}
        path={[]}
        label=""
        dispatch={() => <span data-testid="field" />}
        rootSchema={baseCtx.rootSchema}
        rootData={{ portionen: 4 }}
        ctx={baseCtx}
      />,
    );
    expect(html).toContain("max-width:80ch");
    expect(html.includes("graviola-detail-meta-strip")).toBe(false);
  });

  it("groups consecutive meta-eligible controls into one strip", () => {
    const elements = [
      { type: "Control", scope: "#/properties/portionen" },
      { type: "Control", scope: "#/properties/dauer" },
      { type: "Control", scope: "#/properties/quelle" },
    ];
    const groups = groupTopLevelDetailElements(
      elements,
      baseCtx.rootSchema,
      baseCtx,
    );
    expect(groups[0]?.kind).toBe("meta");
    if (groups[0]?.kind === "meta") {
      expect(groups[0].elements.length).toBe(2);
    }
    expect(groups[1]?.kind).toBe("single");
  });

  it("DetailMetaStrip is a single flex row container for pairs", () => {
    const html = wrap(
      <DetailMetaStrip>
        <PropertyRow label="Portionen">4</PropertyRow>
        <PropertyRow label="Zeit">30</PropertyRow>
      </DetailMetaStrip>,
    );
    expect(html).toContain("graviola-detail-meta-strip");
    expect(html).toContain("Portionen");
    expect(html).toContain("Zeit");
    expect(html).toContain("4");
    expect(html).toContain("30");
  });

  it("compact nested object via buildDispatch renders three values inline without captions", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const quelleSchema = {
      type: "object" as const,
      title: "Quelle",
      properties: {
        art: { type: "string" as const, title: "Art" },
        titel: { type: "string" as const },
        url: { type: "string" as const, format: "uri", title: "URL" },
        autor: { type: "string" as const },
        seite: { type: "string" as const },
        notiz: { type: "string" as const },
      },
    };
    expect(isCompactLeafObjectSchema(quelleSchema)).toBe(true);
    const rootSchema = {
      type: "object" as const,
      properties: { quelle: quelleSchema },
    };
    const data = {
      quelle: {
        art: "Website",
        titel: "Roggen-Gelbkorn-Brot",
        url: "https://example.org/recipe",
      },
    };
    const ctx: DetailTesterContext = {
      ...baseCtx,
      rootSchema,
      depth: 0,
      maxDepth: 8,
      hideHeaderPrimaryFields: true,
      headerPrimaryFieldNames: ["titel"],
    };
    const run = buildDispatch(defaultDetailRenderers, rootSchema, data, ctx);
    const uiSchema = {
      type: "VerticalLayout" as const,
      elements: [{ type: "Control" as const, scope: "#/properties/quelle" }],
    };
    const html = wrap(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: data,
        }}
      >
        {run(uiSchema)}
      </DetailRendererContext.Provider>,
    );
    expect(html).toContain("graviola-detail-compact-object");
    expect(html).toContain("Website");
    expect(html).toContain("Roggen-Gelbkorn-Brot");
    expect(html).toContain("https://example.org/recipe");
    expect(html).toContain("·");
    expect(html).not.toMatch(/>\s*Art\s*</);
    expect(html).not.toMatch(/>\s*URL\s*</);
  });

  it("compact nested object shows captions when more than three values", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const quelleSchema = {
      type: "object" as const,
      title: "Quelle",
      properties: {
        art: { type: "string" as const, title: "Art" },
        titel: { type: "string" as const, title: "Titel" },
        url: { type: "string" as const, format: "uri", title: "URL" },
        autor: { type: "string" as const, title: "Autor" },
        seite: { type: "string" as const, title: "Seite" },
        notiz: { type: "string" as const },
      },
    };
    const rootSchema = {
      type: "object" as const,
      properties: { quelle: quelleSchema },
    };
    const data = {
      quelle: {
        art: "Website",
        titel: "Roggen",
        url: "https://example.org",
        autor: "Chef",
        seite: "12",
      },
    };
    const ctx: DetailTesterContext = {
      ...baseCtx,
      rootSchema,
      depth: 0,
      maxDepth: 8,
      hideHeaderPrimaryFields: true,
      headerPrimaryFieldNames: ["titel"],
    };
    const run = buildDispatch(defaultDetailRenderers, rootSchema, data, ctx);
    const uiSchema = {
      type: "VerticalLayout" as const,
      elements: [{ type: "Control" as const, scope: "#/properties/quelle" }],
    };
    const html = wrap(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: data,
        }}
      >
        {run(uiSchema)}
      </DetailRendererContext.Provider>,
    );
    expect(html).toContain("Art");
    expect(html).toContain("Autor");
    expect(html).not.toContain("·");
  });

  it("meta strip omitted when all meta controls have empty data", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const rootSchema = baseCtx.rootSchema;
    const data = { title: "Hefezopf" };
    const ctx: DetailTesterContext = {
      ...baseCtx,
      rootSchema,
      depth: 0,
      maxDepth: 8,
    };
    const run = buildDispatch(defaultDetailRenderers, rootSchema, data, ctx);
    const uiSchema = {
      type: "TopLevelLayout" as const,
      elements: [
        { type: "Control" as const, scope: "#/properties/portionen" },
        { type: "Control" as const, scope: "#/properties/dauer" },
      ],
    };
    const html = wrap(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: data,
        }}
      >
        {run(uiSchema)}
      </DetailRendererContext.Provider>,
    );
    expect(html).not.toContain("graviola-detail-meta-strip");
  });

  it("meta strip renders when at least one meta control has data", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const rootSchema = baseCtx.rootSchema;
    const data = { portionen: 4, title: "Roggen" };
    const ctx: DetailTesterContext = {
      ...baseCtx,
      rootSchema,
      depth: 0,
      maxDepth: 8,
    };
    const run = buildDispatch(defaultDetailRenderers, rootSchema, data, ctx);
    const uiSchema = {
      type: "TopLevelLayout" as const,
      elements: [
        { type: "Control" as const, scope: "#/properties/portionen" },
        { type: "Control" as const, scope: "#/properties/dauer" },
      ],
    };
    const html = wrap(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: data,
        }}
      >
        {run(uiSchema)}
      </DetailRendererContext.Provider>,
    );
    expect(html).toContain("graviola-detail-meta-strip");
    expect(html).toContain("4");
  });

  it("TopLevelLayout dispatch renders section headings for array and object controls", async () => {
    const { defaultDetailRenderers } = await import("./registries");
    const rootSchema = {
      type: "object" as const,
      properties: {
        zutaten: {
          type: "array" as const,
          title: "Zutaten",
          items: {
            type: "object" as const,
            properties: {
              name: { type: "string" as const },
            },
          },
        },
        quelle: baseCtx.rootSchema.properties!.quelle,
      },
    };
    const data = {
      zutaten: [{ name: "Mehl" }],
      quelle: { art: "Web", url: "https://example.org" },
    };
    const ctx: DetailTesterContext = {
      ...baseCtx,
      rootSchema,
      depth: 0,
      maxDepth: 8,
    };
    const run = buildDispatch(defaultDetailRenderers, rootSchema, data, ctx);
    const uiSchema = {
      type: "TopLevelLayout" as const,
      elements: [
        { type: "Control" as const, scope: "#/properties/zutaten" },
        { type: "Control" as const, scope: "#/properties/quelle" },
      ],
    };
    const html = wrap(
      <DetailRendererContext.Provider
        value={{
          registry: defaultDetailRenderers,
          config: {},
          rootSchema,
          rootData: data,
        }}
      >
        {run(uiSchema)}
      </DetailRendererContext.Provider>,
    );
    expect(html).toContain("Zutaten");
    expect(html).toContain("Quelle");
    const h2Count = (html.match(/<h2/g) ?? []).length;
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  it("PropertyRow meta strip avoids 30% grid", () => {
    const html = wrap(
      <DetailPresentationProvider value={{ metaStrip: true }}>
        <PropertyRow label="Portionen">2</PropertyRow>
      </DetailPresentationProvider>,
    );
    expect(html).not.toContain("grid-template-columns:30%");
    expect(html).toContain("Portionen");
  });

  it("shouldUseImagePlaceholder when load failed", () => {
    expect(shouldUseImagePlaceholder(true, "https://x/y.jpg")).toBe(true);
    expect(shouldUseImagePlaceholder(false, "https://x/y.jpg")).toBe(false);
    expect(shouldUseImagePlaceholder(false, "")).toBe(true);
  });

  it("DetailHeroImage shows placeholder for empty src (SSR-safe)", () => {
    const html = wrap(<DetailHeroImage src="" alt="Hero" />);
    expect(html).toContain("graviola-detail-hero-image-placeholder");
    expect(html).not.toContain("Hero");
  });
});
