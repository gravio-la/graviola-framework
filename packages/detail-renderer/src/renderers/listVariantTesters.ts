import { optionIs, type RankedTester } from "@jsonforms/core";
import { arraynamedEntityTester } from "@graviola/edb-detail-renderer-core";

export type ListVariant = "chips" | "cards" | "listItem" | "searchList";

export const DETAIL_LIST_VARIANT_OPTIONS_KEY = "listVariant" as const;

/** Higher rank than `arraynamedEntityTester` (4) when the uiSchema option matches. */
export function listVariantTester(variant: ListVariant): RankedTester {
  return (ui, schema, ctx) => {
    if (!optionIs(DETAIL_LIST_VARIANT_OPTIONS_KEY, variant)(ui, schema, ctx)) {
      return -1;
    }
    const base = arraynamedEntityTester(ui, schema, ctx);
    return base > 0 ? 50 : -1;
  };
}
