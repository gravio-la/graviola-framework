import type { EntityEmbedView } from "@graviola/entity-ref-core";

export function parseEntityEmbedView(
  value: unknown,
): EntityEmbedView | undefined {
  if (value === "inline" || value === "chip" || value === "card") {
    return value;
  }
  return undefined;
}
