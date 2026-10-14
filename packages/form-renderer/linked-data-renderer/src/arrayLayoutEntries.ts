import type { OrderBySpec } from "@graviola/edb-core-types";
import { sortIndexedByOrderField } from "@graviola/edb-core-utils";
import orderBy from "lodash-es/orderBy";
import uniqBy from "lodash-es/uniqBy";

export type ArrayLayoutEntry = {
  id: unknown;
  childData: unknown;
  index: number;
  label: unknown;
};

export type BuildArrayLayoutEntriesOptions = {
  orderBySpec?: OrderBySpec;
  getItemId: (childData: unknown, index: number) => unknown;
  getItemLabel: (childData: unknown, index: number) => unknown;
};

/** Map array data to display rows; optional order-field sort keeps original data indices. */
export function buildArrayLayoutEntries(
  realData: unknown[] | undefined,
  options: BuildArrayLayoutEntriesOptions,
): ArrayLayoutEntry[] {
  if (!realData?.length) {
    return [];
  }

  if (options.orderBySpec?.field) {
    const sorted = sortIndexedByOrderField(realData, options.orderBySpec);
    const mapped: ArrayLayoutEntry[] = sorted.map(
      ({ item: childData, index }) => ({
        id: options.getItemId(childData, index),
        childData,
        index,
        label: options.getItemLabel(childData, index),
      }),
    );
    return uniqBy(mapped, (entry) => entry.id ?? entry.index);
  }

  const mapped: ArrayLayoutEntry[] = realData.map((childData, index) => ({
    id: options.getItemId(childData, index),
    childData,
    index,
    label: options.getItemLabel(childData, index),
  }));

  const unique = uniqBy(mapped, (entry) => entry.id ?? entry.index);
  return orderBy(unique, ["label"], ["asc"]);
}
