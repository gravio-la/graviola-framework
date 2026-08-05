import type { JSONSchema7 } from "json-schema";
import {
  jsonSchema2Prisma,
  jsonSchema2PrismaWithManifest,
} from "./jsonSchema2Prisma";

const schema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/person.schema.json",
  title: "Human",
  description: "A human being",
  type: "object",
  required: ["name", "father"],
  properties: {
    name: {
      type: "string",
    },
    knows: {
      type: "array",
      items: {
        required: ["nick"],
        properties: {
          nick: { type: "string" },
          label: { type: "string" },
          loves: {
            type: "array",
            items: {
              required: ["name"],
              properties: {
                name: { type: "string" },
              },
            },
          },
        },
      },
    },
    father: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

const itemLike: JSONSchema7 = {
  title: "Item",
  type: "object",
  definitions: {
    Item: {
      type: "object",
      properties: {
        id: { type: "string" },
        type: { type: "string" },
        name: { type: "string" },
        photos: { type: "array", items: { type: "string" } },
        yearCodes: { type: "array", items: { type: "integer" } },
        media: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              author: { type: "string" },
              copyright: {
                type: "object",
                properties: {
                  year: { type: "integer" },
                  notes: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe("convert json schema to prisma schema", () => {
  test("simple schema emits child tables with PK/FK/position", () => {
    const { schemaText, manifest } = jsonSchema2PrismaWithManifest(
      schema,
      new WeakSet(),
      { databaseProvider: "sqlite", reverseMap: {} },
    );
    expect(schemaText).toContain("model Human_knows {");
    expect(schemaText).toContain("id String @id");
    expect(schemaText).toContain("position Int");
    expect(schemaText).toContain("Human_id String");
    expect(schemaText).toContain("onDelete: Cascade");
    expect(schemaText).toContain("model Human_knows_loves {");
    expect(schemaText).toContain("father_name String?");
    expect(manifest.types.Human.knows.representation).toBe("childTable");
    expect(manifest.types.Human.knows.childModel).toBe("Human_knows");
    expect(manifest.types.Human.father.representation).toBe("flattened");
  });

  test("schema with self-relation", () => {
    const prisma = jsonSchema2Prisma(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "https://example.com/person.schema.json",
        definitions: {
          Person: {
            properties: {
              name: { type: "string" },
              knows: {
                $ref: "#/definitions/Person",
              },
            },
          },
        },
      },
      new WeakSet(),
      {
        reverseMap: {
          knows: "knownBy",
        },
      },
    );
    expect(prisma).toBe(`model Person {
  name String?
  knows_id String?
  knows Person?  @relation("knows", fields: [knows_id], references: [id])
  knownBy Person[] @relation("knows")
}`);
  });

  test("primitive and anonymous arrays — sqlite child tables", () => {
    const { schemaText, manifest } = jsonSchema2PrismaWithManifest(
      itemLike,
      new WeakSet(),
      { databaseProvider: "sqlite", reverseMap: {} },
    );
    expect(schemaText).toContain("photos Item_photos[]");
    expect(schemaText).toContain("model Item_photos {");
    expect(schemaText).toContain("value String");
    expect(schemaText).toContain("model Item_yearCodes {");
    expect(schemaText).toContain("value Int");
    expect(schemaText).toContain("model Item_media {");
    expect(schemaText).toContain("copyright_year Int?");
    expect(schemaText).toContain("model Item_media_copyright_notes {");
    expect(manifest.types.Item.photos.representation).toBe("childTable");
    expect(manifest.types.Item.yearCodes.valueType).toBe("Int");
    expect(manifest.types.Item.media.representation).toBe("childTable");
    expect(
      manifest.types.Item.media.properties?.copyright?.properties?.notes
        ?.representation,
    ).toBe("childTable");
  });

  test("primitive and anonymous arrays — mongodb scalar lists + composites", () => {
    const { schemaText, manifest } = jsonSchema2PrismaWithManifest(
      itemLike,
      new WeakSet(),
      { databaseProvider: "mongodb", reverseMap: {} },
    );
    expect(schemaText).toContain("photos String[]");
    expect(schemaText).toContain("yearCodes Int[]");
    expect(schemaText).toContain("type ItemMedia {");
    expect(schemaText).toContain("type ItemMediaCopyright {");
    expect(schemaText).toContain("notes String[]");
    expect(manifest.types.Item.photos.representation).toBe("scalarList");
    expect(manifest.types.Item.media.representation).toBe("embedded");
  });
});
