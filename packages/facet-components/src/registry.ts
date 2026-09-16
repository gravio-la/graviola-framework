import type { FacetBucket } from "@graviola/store-core";
import type { FacetDescriptor } from "@graviola/facet-core";
import type { ComponentType } from "react";

export type FacetRendererProps = {
  descriptor: FacetDescriptor;
  buckets: FacetBucket[];
  selectedValues: Array<string | number | boolean>;
  range?: { gte?: number | string; lte?: number | string };
  stats?: { min: number; max: number };
  onToggle: (value: string | number | boolean) => void;
  onSetRange: (gte?: number | string, lte?: number | string) => void;
  disabled?: boolean;
  approximate?: boolean;
};

export type FacetRendererEntry = {
  tester: (descriptor: FacetDescriptor, buckets: FacetBucket[]) => number;
  Component: ComponentType<FacetRendererProps>;
};

const defaultRegistry: FacetRendererEntry[] = [];

export function registerFacetRenderer(entry: FacetRendererEntry): void {
  defaultRegistry.push(entry);
}

export function resolveFacetRenderer(
  descriptor: FacetDescriptor,
  buckets: FacetBucket[],
  extra?: FacetRendererEntry[],
): FacetRendererEntry | undefined {
  const entries = [...(extra ?? []), ...defaultRegistry];
  let best: FacetRendererEntry | undefined;
  let bestScore = -1;
  for (const entry of entries) {
    const score = entry.tester(descriptor, buckets);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : undefined;
}
