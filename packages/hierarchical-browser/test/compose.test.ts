import { describe, expect, test } from "bun:test";

import { composeChildrenFirst } from "../src/composeChildrenFirst";
import { sortDocuments } from "../src/sortDocuments";

describe("composeChildrenFirst", () => {
  test("containers precede members", async () => {
    const result = await composeChildrenFirst(
      async () => ({
        documents: [{ "@id": "c1", label: "Folder" }],
      }),
      async () => ({
        documents: [{ "@id": "f1", label: "File" }],
      }),
    );
    expect(result.documents.map((d) => d["@id"])).toEqual(["c1", "f1"]);
  });
});

describe("sortDocuments", () => {
  test("sorts by mapped field desc", () => {
    const docs = [
      { "@id": "1", sizeBytes: 10 },
      { "@id": "2", sizeBytes: 5 },
    ];
    const sorted = sortDocuments(docs, [{ field: "size", desc: true }], {
      size: "sizeBytes",
    });
    expect(sorted[0]?.["@id"]).toBe("1");
  });
});
