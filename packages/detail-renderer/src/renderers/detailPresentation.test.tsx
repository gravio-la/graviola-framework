import { describe, expect, it, mock } from "bun:test";

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
import { ObjectRenderer } from "./ObjectRenderer";
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

  it("ObjectRenderer compact leaf object uses inline row", () => {
    const schema = baseCtx.rootSchema.properties!.quelle as object;
    expect(isCompactLeafObjectSchema(schema as never)).toBe(true);
    const html = wrap(
      <ObjectRenderer
        label="Quelle"
        schema={schema as never}
        data={{ art: "Web", url: "https://example.org" }}
        path={["quelle"]}
        uiSchema={{ type: "Control", scope: "#/properties/quelle" }}
        dispatch={() => <span>leaf</span>}
        rootSchema={baseCtx.rootSchema}
        rootData={{}}
        ctx={baseCtx}
      />,
    );
    expect(html).toContain("Quelle");
    expect(html).toContain("graviola-detail-compact-object");
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
