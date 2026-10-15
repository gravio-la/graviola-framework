import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { JsonFormsContext } from "@jsonforms/react";
import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { UploadedAsset } from "@graviola/edb-core-types";
import { compileSchema } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";

const rootSchema: JSONSchema7 = {
  definitions: {
    Photo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { const: "http://example.org/Photo" },
        fileName: { type: "string" },
        storageKey: { type: "string" },
        encodingFormat: { type: "string" },
        contentSize: { type: "number" },
      },
    },
  },
};

const registry = compileSchema(rootSchema);
let lastSaved: Record<string, unknown> | undefined;
let handleChangeCalls: unknown[] = [];

const uploaded: UploadedAsset = {
  assetId: "01ASSET",
  projectId: "p1",
  storageKey: "k1",
  fileName: "x.png",
  encodingFormat: "image/png",
  contentSize: 12,
  sha256: "abc",
  uploadDate: "2026-01-01T00:00:00Z",
  kind: "image",
};

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({
    typeIRIToTypeName: (iri: string) =>
      iri === "http://example.org/Photo" ? "Photo" : undefined,
    createEntityIRI: () => "http://example.org/photo/new",
  }),
  useAssetService: () => mockAssetService,
  useCRUDWithQueryClient: () => ({
    loadQuery: { data: undefined },
    saveMutation: {
      mutateAsync: async (entity: Record<string, unknown>) => {
        lastSaved = entity;
        return { mainDocument: entity };
      },
    },
  }),
  useDispatchIntent: () => () => undefined,
  useThumbnailUrl: () => undefined,
}));

let mockAssetService = {
  enabled: true,
  isAssetRef: () => false,
  assetIdOf: () => undefined,
  thumbnailUrl: () => undefined,
  originalUrl: () => undefined,
  upload: mock(async () => uploaded),
  importFromUrl: mock(async () => uploaded),
  iriFor: () => "http://example.org/asset/01ASSET",
};

mock.module("next-i18next", () => ({
  useTranslation: () => ({
    t: (_k: string, d?: string) => d ?? _k,
  }),
}));

const jsonFormsCtx = {
  core: { data: { "@id": "http://example.org/item/1" } },
  config: { registry, assetClasses: { Photo: "image" } },
};

function withJsonFormsContext(ui: React.ReactElement) {
  return (
    <JsonFormsContext.Provider value={jsonFormsCtx}>
      {ui}
    </JsonFormsContext.Provider>
  );
}

const { AssetFieldRendererComponent } = await import("./AssetFieldRenderer");

describe("AssetFieldRenderer", () => {
  beforeAll(() => {
    const win = new Window();
    // @ts-expect-error happy-dom globals
    globalThis.window = win;
    // @ts-expect-error happy-dom globals
    globalThis.document = win.document;
  });

  beforeEach(() => {
    cleanup();
    lastSaved = undefined;
    handleChangeCalls = [];
    mockAssetService = {
      ...mockAssetService,
      enabled: true,
      upload: mock(async () => uploaded),
    };
  });

  test("upload saves schema-defined props and links IRI", async () => {
    const handleChange = mock((path: string, value: unknown) => {
      handleChangeCalls.push({ path, value });
    });
    const { container } = render(
      withJsonFormsContext(
        <AssetFieldRendererComponent
          id="f"
          path="cover"
          schema={{ $ref: "#/definitions/Photo" }}
          rootSchema={rootSchema}
          config={{ registry, assetClasses: { Photo: "image" } }}
          uischema={{ type: "Control", scope: "#/properties/cover" }}
          label="Cover image"
          visible
          enabled
          errors=""
          data={undefined}
          handleChange={handleChange}
        />,
      ),
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    const file = new File(["x"], "x.png", { type: "image/png" });
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    await waitFor(() => expect(lastSaved).toBeDefined());
    expect(lastSaved).toEqual({
      "@id": "http://example.org/asset/01ASSET",
      "@type": "http://example.org/Photo",
      fileName: "x.png",
      storageKey: "k1",
      encodingFormat: "image/png",
      contentSize: 12,
    });
    await waitFor(() =>
      expect(
        handleChangeCalls.some(
          (c: any) =>
            c.value?.["@id"] === lastSaved?.["@id"] &&
            c.value?.["@type"] === "http://example.org/Photo",
        ),
      ).toBe(true),
    );
    expect(container.textContent).toContain("Cover image");
  });

  test("disabled asset service hides upload input", () => {
    mockAssetService = { ...mockAssetService, enabled: false };
    const { container } = render(
      withJsonFormsContext(
        <AssetFieldRendererComponent
          id="f"
          path="cover"
          schema={{ $ref: "#/definitions/Photo" }}
          rootSchema={rootSchema}
          config={{ registry, assetClasses: { Photo: "image" } }}
          uischema={{ type: "Control", scope: "#/properties/cover" }}
          visible
          enabled
          errors=""
          data={undefined}
          handleChange={() => undefined}
        />,
      ),
    );
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
