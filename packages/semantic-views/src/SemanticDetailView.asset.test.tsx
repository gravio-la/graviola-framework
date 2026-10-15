import { describe, expect, it } from "bun:test";
import type { AssetService } from "@graviola/edb-core-types";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const IMAGE_IRI = "https://example.org/assets/fund-image";
const REPORT_IRI = "https://example.org/assets/fund-report";
const FOTO_IRIS = [
  "https://example.org/assets/foto-1",
  "https://example.org/assets/foto-2",
  "https://example.org/assets/foto-3",
] as const;

const mockAssetService: AssetService = {
  enabled: true,
  isAssetRef: (v) => {
    const iri =
      typeof v === "string"
        ? v
        : v &&
            typeof v === "object" &&
            typeof (v as { "@id"?: string })["@id"] === "string"
          ? (v as { "@id": string })["@id"]
          : "";
    return iri.includes("/assets/");
  },
  assetIdOf: () => "asset-id",
  thumbnailUrl: (ref, size) => {
    const cat =
      typeof size === "string"
        ? size
        : "sizeCategory" in (size as object)
          ? (size as { sizeCategory?: string }).sizeCategory
          : "card";
    return `/thumb?size=${cat}&ref=${encodeURIComponent(String(ref))}`;
  },
  originalUrl: (ref) => `/original?ref=${encodeURIComponent(String(ref))}`,
  upload: async () => {
    throw new Error("not in test");
  },
  importFromUrl: async () => {
    throw new Error("not in test");
  },
  iriFor: () => "urn:asset",
};

const documentRoot: JSONSchema7 = {
  definitions: {
    ImageObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/ImageObject" },
      },
    },
    ImageObjectStub: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/ImageObject" },
      },
    },
    MediaObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/MediaObject" },
        fileName: { type: "string" },
        encodingFormat: { type: "string" },
      },
    },
    MediaObjectStub: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/MediaObject" },
      },
    },
    Fundstueck: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "https://ex.org/Fundstueck" },
        image: { $ref: "#/definitions/ImageObjectStub" },
        fotos: {
          type: "array",
          items: { $ref: "#/definitions/ImageObjectStub" },
        },
        fundbericht: { $ref: "#/definitions/MediaObjectStub" },
      },
    },
  },
};

const fundstueckSchema = bringDefinitionToTop(documentRoot, "Fundstueck");

const entityData = {
  "@id": "https://ex.org/fund/1",
  "@type": "https://ex.org/Fundstueck",
  image: {
    "@id": IMAGE_IRI,
    "@type": "https://ex.org/ImageObject",
    __label: "Hauptbild",
  },
  fotos: [...FOTO_IRIS],
  fundbericht: {
    "@id": REPORT_IRI,
    "@type": "https://ex.org/MediaObject",
    fileName: "fundbericht.pdf",
    encodingFormat: "application/pdf",
  },
};

async function renderDetailHtml(): Promise<string> {
  const { AdbProvider } = await import("@graviola/edb-state-hooks");
  const { SemanticDetailViewNoOps } = await import("./SemanticDetailView");
  const theme = createTheme();
  return renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <AdbProvider
        schema={documentRoot}
        assetClasses={{ ImageObject: "image", MediaObject: "file" }}
        assetService={mockAssetService}
        typeNameToTypeIRI={(name) => `https://ex.org/${name}`}
        typeIRIToTypeName={(iri) =>
          iri === "https://ex.org/Fundstueck" ? "Fundstueck" : undefined
        }
        createEntityIRI={(type, id) => `https://ex.org/${type}/${id ?? "new"}`}
        propertyNameToIRI={(p) => `https://ex.org/prop/${p}`}
        propertyIRIToPropertyName={() => undefined}
        jsonLDConfig={{ context: {} }}
        queryBuildOptions={{ primaryFields: {}, primaryFieldExtracts: {} }}
        env={{ publicBasePath: "", baseIRI: "https://ex.org/" }}
      >
        <SemanticDetailViewNoOps
          data={entityData}
          schema={fundstueckSchema}
          typeIRI="https://ex.org/Fundstueck"
          typeName="Fundstueck"
          entityIRI="https://ex.org/fund/1"
        />
      </AdbProvider>
    </ThemeProvider>,
  );
}

describe("SemanticDetailView asset dispatch", () => {
  it("renders asset thumbnails and download link instead of IRI chips", async () => {
    const html = await renderDetailHtml();
    const imgCount = (html.match(/<img/g) ?? []).length;

    expect(imgCount).toBeGreaterThanOrEqual(4);
    expect(html).toMatch(/\/thumb\?size=/);
    expect(html).toMatch(/\/original\?ref=/);

    expect(html).not.toContain(IMAGE_IRI);
    expect(html).not.toContain(FOTO_IRIS[0]);
    expect(html).not.toContain(REPORT_IRI);
  });
});
