import { describe, expect, it } from "bun:test";

import { extractEntityPreview } from "./extractEntityPreview";

describe("extractEntityPreview", () => {
  it("reads instance fields from primaryFields", () => {
    const preview = extractEntityPreview({
      data: { name: "Hello", bio: "World", thumb: "http://x/img" },
      typeName: "Item",
      primaryFields: {
        Item: { label: "name", description: "bio", image: "thumb" },
      },
    });
    expect(preview.label).toBe("Hello");
    expect(preview.description).toBe("World");
    expect(preview.image).toBe("http://x/img");
  });

  it("applies type-level icon and color", () => {
    const preview = extractEntityPreview({
      data: { name: "X" },
      typeName: "Item",
      primaryFields: { Item: { label: "name" } },
      typePresentation: { Item: { icon: "Folder", color: "primary" } },
    });
    expect(preview.icon).toBe("Folder");
    expect(preview.color).toBe("primary");
    expect(preview.displayMedia).toBe("icon");
    expect(preview.displayIcon).toBe("Folder");
  });

  it("icon wins over instance image in chip/list display", () => {
    const preview = extractEntityPreview({
      data: { name: "X", thumb: "https://example.com/t.png" },
      typeName: "Item",
      primaryFields: {
        Item: { label: "name", image: "thumb" },
      },
      typePresentation: { Item: { icon: "📦" } },
    });
    expect(preview.image).toBe("https://example.com/t.png");
    expect(preview.displayMedia).toBe("icon");
    expect(preview.displayIcon).toBe("📦");
    expect(preview.displayImage).toBeUndefined();
  });

  it("merges override(data) on top", () => {
    const preview = extractEntityPreview({
      data: { name: "X", urgent: true },
      typeName: "Item",
      primaryFields: { Item: { label: "name" } },
      typePresentation: {
        Item: {
          color: "default",
          override: (d) =>
            (d as { urgent?: boolean }).urgent ? { color: "error" } : {},
        },
      },
    });
    expect(preview.color).toBe("error");
  });

  it("returns empty when typeName is missing", () => {
    expect(extractEntityPreview({ data: {}, typeName: undefined })).toEqual({});
  });

  it("reads image from embedded asset object @id and from arrays", () => {
    const iri =
      "https://example.org/projects/p1/asset/01ARZ3NDEKTSV4RRFFQ69G5FAV";
    const fromObject = extractEntityPreview({
      data: {
        name: "X",
        thumb: { "@id": iri, storageKey: "p1/x.png" },
      },
      typeName: "Item",
      primaryFields: { Item: { label: "name", image: "thumb" } },
    });
    expect(fromObject.image).toBe(iri);

    const fromArray = extractEntityPreview({
      data: {
        name: "Y",
        thumb: [{ "@id": iri }],
      },
      typeName: "Item",
      primaryFields: { Item: { label: "name", image: "thumb" } },
    });
    expect(fromArray.image).toBe(iri);
  });

  it("keeps storageKey-only asset object for asset service refs", () => {
    const preview = extractEntityPreview({
      data: {
        name: "Z",
        thumb: { storageKey: "p1/01ARZ3NDEKTSV4RRFFQ69G5FAV.png" },
      },
      typeName: "Item",
      primaryFields: { Item: { label: "name", image: "thumb" } },
    });
    expect(preview.image).toEqual({
      storageKey: "p1/01ARZ3NDEKTSV4RRFFQ69G5FAV.png",
    });
  });
});
