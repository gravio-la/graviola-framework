import { describe, expect, test } from "bun:test";
import { selectEntry } from "@graviola/edb-detail-renderer-core";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

import { ArticleNamedEntityRenderer } from "./article/ArticleNamedEntityRenderer";
import {
  articleNamedEntityTester,
  defaultArticleRenderers,
} from "./registries";

describe("article registry dispatch", () => {
  const schema = {
    type: "object",
    anyOf: [
      {
        type: "object",
        properties: {
          "@id": { type: "string" },
          "@type": { type: "string" },
        },
      },
    ],
    properties: {
      "@id": { type: "string" },
      "@type": { type: "string" },
    },
  };
  const ui = { type: "Control", scope: "#" };

  test("exported articleNamedEntityTester ranks above anyOf (7)", () => {
    const testerCtx = {
      config: {
        rootSchema: schema,
        presentation: "article" as const,
        depth: 0,
        maxDepth: 6,
      },
    };
    expect(articleNamedEntityTester(ui, schema, testerCtx)).toBe(7);
  });

  test("selectEntry picks ArticleNamedEntityRenderer in article mode despite anyOf", () => {
    const ctx: DetailTesterContext = {
      rootSchema: schema,
      depth: 0,
      maxDepth: 6,
      presentation: "article",
    };
    const entry = selectEntry(defaultArticleRenderers, ui, schema, ctx);
    expect(entry?.renderer).toBe(ArticleNamedEntityRenderer);
  });

  test("without article presentation, ArticleNamedEntityRenderer is not selected", () => {
    const ctx: DetailTesterContext = {
      rootSchema: schema,
      depth: 0,
      maxDepth: 6,
    };
    const entry = selectEntry(defaultArticleRenderers, ui, schema, ctx);
    expect(entry?.renderer).not.toBe(ArticleNamedEntityRenderer);
  });
});
