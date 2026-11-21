import { describe, expect, test } from "bun:test";

import { resolveInitialColumnVisibility } from "./semanticTableColumnVisibility";

test("resolveInitialColumnVisibility merges registry default and per-type overrides", () => {
  const visibility = resolveInitialColumnVisibility(
    { columnVisibility: { maker_entity: false } },
    {
      default: { columnVisibility: { name_single: false } },
      Item: { columnVisibility: { maker_entity: false } },
    },
    { tags_label_group: false },
  );
  expect(visibility.name_single).toBe(false);
  expect(visibility.maker_entity).toBe(false);
  expect(visibility.tags_label_group).toBe(false);
  expect(visibility["@id_single"]).toBe(false);
});
