/**
 * Live end-to-end: lifecycle helpers against a running Meilisearch + fixture Store.
 *
 *   MEILI_URL=http://127.0.0.1:7701 bun test ./test/lifecycle.e2e.test.ts
 */
import { describe, expect, test } from "bun:test";

import {
  clearFulltextIndexes,
  describeFulltextIndexes,
  populateFromStore,
  pushFulltextIndexes,
  resetFulltextIndexes,
} from "@graviola/fulltext-search-core";
import {
  createMeilisearchAdapter,
  initMeilisearchSparqlStore,
} from "../src/index";
import {
  createFixturePrimaryStore,
  fixturePrimaryFields,
  fixtureSchema,
  fixtureSidecar,
} from "./fixtures/create-fixture-primary-store";

const MEILI_URL = process.env.MEILI_URL?.trim();
const PREFIX = `lifecycle-e2e-${Date.now()}-`;

describe.skipIf(!MEILI_URL)("lifecycle e2e against Meilisearch", () => {
  test("push → populate → search → clear → reset", async () => {
    const adapter = createMeilisearchAdapter({ baseUrl: MEILI_URL! });
    const indexNameForType = (t: string) => `${PREFIX}${t}`;
    const lifecycle = {
      adapter,
      searchFacetSchema: fixtureSidecar,
      schema: fixtureSchema,
      primaryFields: fixturePrimaryFields,
      indexNameForType,
    };

    expect((await describeFulltextIndexes(lifecycle)).hasDrift).toBe(true);

    await pushFulltextIndexes(lifecycle);
    expect((await describeFulltextIndexes(lifecycle)).hasDrift).toBe(false);

    const primaryStore = await createFixturePrimaryStore();
    const ftStore = initMeilisearchSparqlStore({
      primaryStore,
      meilisearch: { baseUrl: MEILI_URL! },
      schema: fixtureSchema,
      primaryFields: fixturePrimaryFields,
      searchFacetSchema: fixtureSidecar,
      indexNameForType,
    });

    const populated = await populateFromStore({
      ...lifecycle,
      ftStore,
      source: primaryStore,
      order: ["Place", "Artist", "Exhibition"],
    });
    expect(populated.total).toBeGreaterThanOrEqual(6);
    expect(
      (await describeFulltextIndexes(lifecycle)).types.find(
        (t) => t.typeName === "Exhibition",
      )?.numberOfDocuments,
    ).toBe(2);

    const search = await ftStore.searchDocuments("Exhibition", "Modern", {
      hydrate: false,
    });
    expect(search.documents[0]?.title).toBe("Modern Masters");

    await clearFulltextIndexes(lifecycle);
    expect(
      (await describeFulltextIndexes(lifecycle)).types.find(
        (t) => t.typeName === "Exhibition",
      )?.numberOfDocuments,
    ).toBe(0);

    await resetFulltextIndexes(lifecycle);
    expect(
      (await describeFulltextIndexes(lifecycle)).types
        .filter((t) => t.searchable)
        .every((t) => !t.exists),
    ).toBe(true);
  }, 120_000);
});
