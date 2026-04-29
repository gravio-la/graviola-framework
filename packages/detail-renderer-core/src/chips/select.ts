import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import { selectEntry } from "../registry/select";
import type {
  ChipDefinition,
  ChipRendererEntry,
  ChipsConfig,
  DetailTesterContext,
} from "../types";

export type ChipResolution =
  | { mode: "registry"; entry: ChipRendererEntry }
  | {
      mode: "shortcut";
      definition: ChipDefinition;
      /** Caller maps to concrete ChipRendererEntry using schema shape */
      shortcut: "byTypeIRI";
    }
  | null;

export function resolveChipRenderer(
  schema: JSONSchema7,
  path: string[],
  config: ChipsConfig | undefined,
  ctx: DetailTesterContext,
): ChipResolution {
  const typeIRI = extractTypeIRI(schema);
  const shortcut = typeIRI ? config?.byTypeIRI?.[typeIRI] : undefined;
  if (shortcut != null) {
    if (isChipRendererEntry(shortcut))
      return { mode: "registry", entry: shortcut };
    return {
      mode: "shortcut",
      definition: shortcut,
      shortcut: "byTypeIRI",
    };
  }

  const registry = config?.registry ?? [];
  if (!registry.length) return null;

  const uischema = (
    path.length > 0
      ? {
          type: "Control",
          scope: `#/properties/${path.join("/properties/")}`,
        }
      : { type: "Control", scope: "#" }
  ) as ControlElement;

  const entry = selectEntry(
    registry,
    uischema,
    schema as unknown as JsonSchema,
    ctx,
  );
  return entry ? { mode: "registry", entry } : null;
}

function isChipRendererEntry(
  v: ChipRendererEntry | ChipDefinition,
): v is ChipRendererEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    "tester" in v &&
    typeof (v as ChipRendererEntry).tester === "function"
  );
}
