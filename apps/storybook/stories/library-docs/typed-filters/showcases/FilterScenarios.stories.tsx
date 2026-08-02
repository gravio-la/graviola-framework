import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import { geoStats } from "@graviola/sample-data-geo";

import { withGeoSampleData } from "../../../../.storybook/decorators";
import { FilterPipelineLive } from "./FilterPipelineLive";

const meta: Meta<typeof FilterPipelineLive> = {
  title: "Library Docs/Typed Filters/Scenarios",
  component: FilterPipelineLive,
  decorators: [withGeoSampleData],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Typed `where` / `include` filters against the committed Wikidata-derived geo fixture",
          "(`@graviola/sample-data-geo`). Each story shows filter JSON → generated SPARQL CONSTRUCT",
          "→ raw JSON-LD → SemanticTableView.",
        ].join(" "),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterPipelineLive>;

async function assertResultCount(
  canvasElement: HTMLElement,
  expected: number,
  tolerance = 0,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("filter-result-count")).toBeInTheDocument();
    },
    { timeout: 30_000 },
  );
  const chip = canvas.getByTestId("filter-result-count");
  const count = Number(chip.getAttribute("data-count"));
  expect(count).toBeGreaterThanOrEqual(expected - tolerance);
  expect(count).toBeLessThanOrEqual(expected + tolerance);
}

export const AllCities: Story = {
  args: {
    description: "All cities (baseline — no where clause)",
    typeName: "City",
    filterOptions: {},
    limit: 10,
    expectedCount: 10,
    note: "limit: 10 caps the result set for a readable table; the store holds 127 City entities.",
  },
  play: async ({ canvasElement }) => {
    await assertResultCount(canvasElement, 10);
  },
};

export const SmallCities: Story = {
  args: {
    description: "Cities with fewer than 20,000 inhabitants",
    typeName: "City",
    filterOptions: {
      where: { population: { lt: 20_000 } },
    },
    expectedCount: geoStats.citiesPopLt20k,
  },
  play: async ({ canvasElement }) => {
    await assertResultCount(canvasElement, geoStats.citiesPopLt20k);
  },
};

export const NameContainsBurg: Story = {
  args: {
    description: 'Cities whose name contains "burg" (case-sensitive)',
    typeName: "City",
    filterOptions: {
      where: { name: { contains: "burg" } },
    },
    expectedCount: geoStats.citiesNameContainsBurg,
    note: 'CONTAINS is case-sensitive by default — "burg" matches Quedlinburg; "Burg" matches a smaller set.',
  },
  play: async ({ canvasElement }) => {
    await assertResultCount(canvasElement, geoStats.citiesNameContainsBurg);
  },
};

export const SmallAndBurg: Story = {
  args: {
    description: "Small cities AND name contains burg",
    typeName: "City",
    filterOptions: {
      where: {
        AND: [{ population: { lt: 20_000 } }, { name: { contains: "burg" } }],
      },
    },
  },
};

export const ChildrenOfAPlace: Story = {
  args: {
    description: "Cities that are partOf Landkreis Görlitz (Q6317)",
    typeName: "City",
    filterOptions: {
      where: {
        partOf: { "@id": geoStats.richestCityParentIRI },
      },
    },
    expectedCount: geoStats.richestCityParentChildCount,
    note: "Forward `partOf` filter by parent `@id`. Q6317 has the most City children in this fixture.",
  },
};

export const PlacesWithBurgChildren: Story = {
  args: {
    description: "Places that have at least one child whose name contains burg",
    typeName: "Place",
    filterOptions: {
      where: {
        parts: { some: { name: { contains: "burg" } } },
      },
    },
    expectedCount: 0,
    note: [
      "Known gap: `parts` is declared with `x-inverseOf` → `partOf`.",
      "The generated WHERE still binds `?subject :parts ?x` instead of the inverse triple,",
      "so this query currently returns 0. Tracked in",
      "https://github.com/gravio-la/graviola-framework/issues/5 — not patched here.",
      "Compare with ChildrenOfAPlace, which filters on the stored forward edge.",
    ].join(" "),
  },
};

/**
 * Forward child links via stored `contains` (not `parts` / x-inverseOf).
 * Landkreis Görlitz has 12 City children in the fixture.
 *
 * Pagination uses flavour `lateral` (SEP-0006) so `take`/`orderBy` window
 * per parent. Non-lateral engines fall back to extraction-stage sort+slice.
 */
export const PaginatedChildren: Story = {
  args: {
    description:
      "Landkreis Görlitz — contains take:5 orderBy name asc (LATERAL)",
    typeName: "Place",
    filterOptions: {
      where: {
        name: { equals: "Landkreis Görlitz" },
      },
      include: {
        contains: {
          take: 5,
          orderBy: { name: "asc" as const },
        },
      },
      flavour: "lateral",
    },
    expectedCount: 1,
    note: [
      "Forward `contains` is materialized from inverted `partOf`.",
      "With flavour `lateral`, CONSTRUCT emits",
      "LATERAL { SELECT ?subject ?contains … ORDER BY ?name LIMIT 5 }",
      "so the first five children by name are Bad Muskau … Löbau.",
      "Expand `contains` in the raw JSON / table. Inverse `parts` remains issue #5.",
    ].join(" "),
  },
  play: async ({ canvasElement }) => {
    await assertResultCount(canvasElement, 1);
  },
};
