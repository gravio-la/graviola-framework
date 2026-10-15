import { beforeAll, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import { compileSchema } from "@graviola/json-schema-utils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { JSONSchema7 } from "json-schema";
import { render } from "@testing-library/react";
import React, { useState } from "react";

import { AssetFieldRendererComponent } from "./AssetFieldRenderer";
import { assetFieldTester, assetGalleryTester } from "./assetTesters";

const IMAGE_TYPE = "http://schema.org/ImageObject";
const MEDIA_TYPE = "http://schema.org/MediaObject";
const FUND_TYPE = "http://example.org/Fundstueck";

const rootSchema: JSONSchema7 = {
  type: "object",
  definitions: {
    ImageObjectStub: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: IMAGE_TYPE },
      },
    },
    MediaObjectStub: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: MEDIA_TYPE },
      },
    },
    ImageObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: IMAGE_TYPE },
        fileName: { type: "string" },
        storageKey: { type: "string" },
        encodingFormat: { type: "string" },
        contentSize: { type: "number" },
      },
    },
    MediaObject: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: MEDIA_TYPE },
        fileName: { type: "string" },
        storageKey: { type: "string" },
        encodingFormat: { type: "string" },
        contentSize: { type: "number" },
      },
    },
  },
  properties: {
    "@id": { type: "string" },
    "@type": { const: FUND_TYPE },
    name: { type: "string" },
    beschreibung: { type: "string" },
    image: { $ref: "#/definitions/ImageObjectStub" },
    fotos: {
      type: "array",
      items: { $ref: "#/definitions/ImageObjectStub" },
    },
    fundbericht: { $ref: "#/definitions/MediaObjectStub" },
  },
  required: ["name"],
};

const registry = compileSchema(rootSchema);

const candidatesProvider = mock(async () => [] as const);

const stableAssetService = {
  enabled: true,
  isAssetRef: () => false,
  assetIdOf: () => undefined,
  thumbnailUrl: () => undefined,
  originalUrl: () => undefined,
  upload: mock(async () => ({
    assetId: "a1",
    projectId: "p1",
    storageKey: "k1",
    fileName: "x.png",
    encodingFormat: "image/png",
    contentSize: 1,
    sha256: "x",
    uploadDate: "2026-01-01T00:00:00Z",
    kind: "image" as const,
  })),
  importFromUrl: mock(async () => ({
    assetId: "a1",
    projectId: "p1",
    storageKey: "k1",
    fileName: "x.png",
    encodingFormat: "image/png",
    contentSize: 1,
    sha256: "x",
    uploadDate: "2026-01-01T00:00:00Z",
    kind: "image" as const,
  })),
  iriFor: () => "http://example.org/asset/a1",
  candidates: candidatesProvider,
};

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({
    typeIRIToTypeName: (iri: string) => {
      if (iri === IMAGE_TYPE) return "ImageObject";
      if (iri === MEDIA_TYPE) return "MediaObject";
      if (iri === FUND_TYPE) return "Fundstueck";
      return undefined;
    },
    createEntityIRI: () => "http://example.org/fund/new",
    assetService: stableAssetService,
  }),
  useAssetService: () => stableAssetService,
  useCRUDWithQueryClient: () => ({
    loadQuery: { data: undefined, isFetching: false },
    saveMutation: {
      mutateAsync: async (entity: Record<string, unknown>) => ({
        mainDocument: entity,
      }),
    },
  }),
  useDispatchIntent: () => () => undefined,
  useThumbnailUrl: () => undefined,
}));

mock.module("next-i18next", () => ({
  useTranslation: () => ({
    t: (_k: string, d?: string) => d ?? _k,
  }),
}));

const theme = createTheme();

const uischema = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/name" },
    { type: "Control", scope: "#/properties/beschreibung" },
    { type: "Control", scope: "#/properties/image" },
    { type: "Control", scope: "#/properties/fotos" },
    { type: "Control", scope: "#/properties/fundbericht" },
  ],
} as const;

const jsonFormsConfig = {
  registry,
  assetClasses: { ImageObject: "image", MediaObject: "file" },
  assetService: stableAssetService,
  typeIRIToTypeName: (iri: string) => {
    if (iri === IMAGE_TYPE) return "ImageObject";
    if (iri === MEDIA_TYPE) return "MediaObject";
    if (iri === FUND_TYPE) return "Fundstueck";
    return undefined;
  },
  primaryFields: {},
  formsPath: "#/definitions/Fundstueck",
  typeIRI: FUND_TYPE,
};

let assetFieldRenderCount = 0;
let assetGalleryRenderCount = 0;

const { AssetGalleryRendererComponent } =
  await import("./AssetGalleryRenderer");

function CountingAssetFieldRenderer(
  props: React.ComponentProps<typeof AssetFieldRendererComponent>,
) {
  assetFieldRenderCount += 1;
  return <AssetFieldRendererComponent {...props} />;
}

function CountingAssetGalleryRenderer(
  props: React.ComponentProps<typeof AssetGalleryRendererComponent>,
) {
  assetGalleryRenderCount += 1;
  return <AssetGalleryRendererComponent {...props} />;
}

const renderers = [
  ...materialRenderers,
  { tester: assetFieldTester, renderer: CountingAssetFieldRenderer },
  { tester: assetGalleryTester, renderer: CountingAssetGalleryRenderer },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("new entity form with asset fields", () => {
  beforeAll(() => {
    const win = new Window();
    // @ts-expect-error happy-dom globals
    globalThis.window = win;
    // @ts-expect-error happy-dom globals
    globalThis.document = win.document;
  });

  test(
    "does not spin render or onChange loops on mount",
    async () => {
      assetFieldRenderCount = 0;
      assetGalleryRenderCount = 0;
      let onChangeCount = 0;

      function FormHarness() {
        const [data, setData] = useState<Record<string, unknown>>({
          "@id": "http://example.org/fund/new-1",
          "@type": FUND_TYPE,
        });
        return (
          <ThemeProvider theme={theme}>
            <JsonForms
              schema={rootSchema}
              uischema={uischema}
              data={data}
              renderers={renderers}
              config={jsonFormsConfig}
              onChange={({ data: next }) => {
                onChangeCount += 1;
                setData(next as Record<string, unknown>);
              }}
            />
          </ThemeProvider>
        );
      }

      render(<FormHarness />);

      await sleep(500);

      const fieldRendersAfterSettle = assetFieldRenderCount;
      const galleryRendersAfterSettle = assetGalleryRenderCount;
      const onChangeAfterSettle = onChangeCount;

      await sleep(300);

      expect(candidatesProvider).not.toHaveBeenCalled();
      expect(assetFieldRenderCount).toBe(fieldRendersAfterSettle);
      expect(assetGalleryRenderCount).toBe(galleryRendersAfterSettle);
      expect(onChangeCount).toBe(onChangeAfterSettle);
      expect(onChangeCount).toBeLessThanOrEqual(2);
      expect(assetFieldRenderCount).toBeLessThan(30);
      expect(assetGalleryRenderCount).toBeLessThan(30);
    },
    { timeout: 5000 },
  );
});
