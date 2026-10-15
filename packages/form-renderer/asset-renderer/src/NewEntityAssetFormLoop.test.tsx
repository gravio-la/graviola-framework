import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { materialRenderers } from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import {
  bringDefinitionToTop,
  compileSchema,
} from "@graviola/json-schema-utils";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { JSONSchema7 } from "json-schema";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React, { useState } from "react";

import { assetFieldTester, assetGalleryTester } from "./assetTesters";

const IMAGE_TYPE = "http://schema.org/ImageObject";
const MEDIA_TYPE = "http://schema.org/MediaObject";
const FUND_TYPE = "http://example.org/Fundstueck";

const documentRoot: JSONSchema7 = {
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
    Fundstueck: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: FUND_TYPE },
        name: { type: "string" },
        beschreibung: { type: "string" },
        image: { $ref: "#/definitions/ImageObjectStub" },
        fotos: {
          type: "array",
          title: "Fotos",
          items: { $ref: "#/definitions/ImageObjectStub" },
        },
        fundbericht: { $ref: "#/definitions/MediaObjectStub" },
      },
      required: ["name"],
    },
  },
};

const rootSchema = bringDefinitionToTop(documentRoot, "Fundstueck");
const registry = compileSchema(documentRoot);

const candidatesProvider = mock(async () => [] as const);

let uploadCallCount = 0;
const saveCalls: Record<string, unknown>[] = [];

const stableAssetService = {
  enabled: true,
  isAssetRef: () => false,
  assetIdOf: () => undefined,
  thumbnailUrl: () => undefined,
  originalUrl: () => undefined,
  upload: mock(async (file: File) => {
    uploadCallCount += 1;
    const n = uploadCallCount;
    await sleep(5 + Math.floor(Math.random() * 15));
    return {
      assetId: `a${n}`,
      projectId: "p1",
      storageKey: `k${n}`,
      fileName: file.name,
      encodingFormat: file.type || "image/jpeg",
      contentSize: file.size || 1,
      sha256: "x",
      uploadDate: "2026-01-01T00:00:00Z",
      kind: "image" as const,
    };
  }),
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
  iriFor: (asset: { assetId: string }) =>
    `http://example.org/asset/${asset.assetId}`,
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
      mutateAsync: async (entity: Record<string, unknown>) => {
        saveCalls.push(entity);
        return { mainDocument: entity };
      },
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
  rootSchema,
  assetClasses: {
    ImageObject: "image",
    ImageObjectStub: "image",
    MediaObject: "file",
    MediaObjectStub: "file",
  },
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

const { AssetGalleryRenderer } = await import("./AssetGalleryRenderer");
const { AssetFieldRenderer } = await import("./AssetFieldRenderer");

function CountingAssetFieldRenderer(
  props: React.ComponentProps<typeof AssetFieldRenderer>,
) {
  assetFieldRenderCount += 1;
  return <AssetFieldRenderer {...props} />;
}

function CountingAssetGalleryRenderer(
  props: React.ComponentProps<typeof AssetGalleryRenderer>,
) {
  assetGalleryRenderCount += 1;
  return <AssetGalleryRenderer {...props} />;
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
  afterEach(() => {
    cleanup();
  });

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

  test(
    "gallery upload keeps form data and writes linked entity objects",
    async () => {
      uploadCallCount = 0;
      saveCalls.length = 0;
      let latestData: Record<string, unknown> = {
        "@id": "http://example.org/fund/new-1",
        "@type": FUND_TYPE,
        name: "Fund Alpha",
      };

      function FormHarness() {
        const [data, setData] = useState<Record<string, unknown>>(() => ({
          "@id": "http://example.org/fund/new-1",
          "@type": FUND_TYPE,
          name: "Fund Alpha",
        }));
        latestData = data;
        return (
          <ThemeProvider theme={theme}>
            <JsonForms
              schema={rootSchema}
              uischema={uischema}
              data={data}
              renderers={renderers}
              config={jsonFormsConfig}
              onChange={({ data: next }) => {
                const typed = next as Record<string, unknown>;
                latestData = typed;
                setData(typed);
              }}
            />
          </ThemeProvider>
        );
      }

      const { container, getAllByText } = render(<FormHarness />);

      await waitFor(
        () => {
          expect(getAllByText("Fotos").length).toBeGreaterThan(0);
          expect(
            container.querySelector('input[type="file"][multiple]'),
          ).toBeTruthy();
        },
        { timeout: 3000 },
      );

      const nameInput = container.querySelector(
        '[id="#/properties/name-input"]',
      ) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "Fund Alpha" } });

      const galleryInput = container.querySelector(
        'input[type="file"][multiple]',
      ) as HTMLInputElement;

      const fileNames = ["one.jpg", "two.jpg", "three.jpg"];
      for (const [i, name] of fileNames.entries()) {
        const file = new File([`img-${i}`], name, { type: "image/jpeg" });
        fireEvent.change(galleryInput, { target: { files: [file] } });
      }

      await waitFor(
        () => {
          expect(uploadCallCount).toBe(3);
          expect(saveCalls.length).toBe(3);
        },
        { timeout: 8000 },
      );

      expect(new Set(saveCalls.map((e) => e["@id"])).size).toBe(3);

      await waitFor(
        () => {
          expect(latestData.name).toBe("Fund Alpha");
          const fotos = latestData.fotos as Array<Record<string, unknown>>;
          expect(fotos?.length).toBe(3);
          expect(new Set(fotos.map((f) => f["@id"])).size).toBe(3);
          for (const item of fotos) {
            expect(item["@type"]).toBe(IMAGE_TYPE);
          }
          expect(fotos.map((f) => f.__label).sort()).toEqual(
            [...fileNames].sort(),
          );
        },
        { timeout: 15000 },
      );
    },
    { timeout: 20000 },
  );
});
