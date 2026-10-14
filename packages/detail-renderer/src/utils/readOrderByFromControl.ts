import type { ControlElement } from "@jsonforms/core";
import type { OrderBySpec } from "@graviola/edb-core-types";

/** Read `options.orderBy` from a JSON Forms array Control. */
export function readOrderByFromControl(
  uiSchema: unknown,
): OrderBySpec | undefined {
  const ob = (uiSchema as ControlElement | undefined)?.options?.orderBy;
  if (
    ob &&
    typeof ob === "object" &&
    typeof (ob as OrderBySpec).field === "string"
  ) {
    return ob as OrderBySpec;
  }
  return undefined;
}
