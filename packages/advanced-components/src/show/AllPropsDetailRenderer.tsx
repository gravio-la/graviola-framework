import { rankWith } from "@jsonforms/core";
import type { DetailRendererRegistryEntry } from "@graviola/edb-detail-renderer-core";

import { AllPropTable } from "./AllPropsTable";
import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

/** Rank-0 fallback: tabular dump when no other renderer matches. */
export function AllPropsDetailRenderer({ data }: DetailRendererProps) {
  return <AllPropTable allProps={data} />;
}

export const allPropsDetailRendererEntry: DetailRendererRegistryEntry = {
  tester: rankWith(0, () => true),
  renderer: AllPropsDetailRenderer,
};
