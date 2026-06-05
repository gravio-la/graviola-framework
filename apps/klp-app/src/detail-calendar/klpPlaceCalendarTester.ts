import type { ControlElement } from "@jsonforms/core";
import { isControl, rankWith } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

/** Matches `definitions.Event.properties.@type.const` in `klp.schema.json`. */
export const KLP_EVENT_TYPE_CONST_IRI =
  "https://ontology.kulturelle-landpartie.de/Event" as const;

function scopeLastSegment(scope: string | undefined): string | null {
  if (!scope || typeof scope !== "string") return null;
  const trimmed = scope.replace(/\/$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

/**
 * Targets `Place.events` only — array items are `Event` (`@type` const IRI +
 * occurrences array distinguishes from other `@id` arrays).
 *
 * Rank 25 beats default `namedEntityTester`/`arraynamedEntityTester`/`enumTester`.
 */
export const klpPlaceCalendarDetailTester = rankWith(
  25,
  (uischema, schemaRaw) => {
    if (!isControl(uischema)) return false;
    const schema = schemaRaw as JSONSchema7 | undefined;
    if (!schema || schema.type !== "array") return false;

    const last = scopeLastSegment((uischema as ControlElement).scope);
    if (last !== "events") return false;

    const items = schema.items as JSONSchema7 | undefined;
    if (!items || typeof items === "boolean") return false;
    const atNode = items.properties?.["@type"] as JSONSchema7 | undefined;
    if (
      !(
        atNode &&
        typeof atNode === "object" &&
        atNode.const === KLP_EVENT_TYPE_CONST_IRI
      )
    ) {
      return false;
    }
    const occ = items.properties?.occurrences as JSONSchema7 | undefined;
    return Boolean(occ && occ.type === "array");
  },
);
