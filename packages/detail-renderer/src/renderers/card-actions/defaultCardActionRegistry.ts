import type { JSONSchema7 } from "json-schema";
import { rankWith } from "@jsonforms/core";
import type { CardActionEntry } from "@graviola/edb-detail-renderer-core";

import { PlayableAudioActionRenderer } from "./PlayableAudioActionRenderer";

function findPlayableAudioProperty(
  schema: JSONSchema7,
  data: Record<string, unknown>,
): { name: string; url: string } | null {
  const props = schema.properties ?? {};
  for (const [name, propSchema] of Object.entries(props)) {
    const ps = propSchema as JSONSchema7 & { contentMediaType?: string };
    const cmt = ps.contentMediaType;
    if (typeof cmt !== "string" || !cmt.startsWith("audio/")) continue;
    const val = data[name];
    if (typeof val === "string" && val.length > 0) {
      return { name, url: val };
    }
  }
  return null;
}

function schemaHasAudioProperty(schema: JSONSchema7): boolean {
  const props = schema.properties ?? {};
  return Object.values(props).some((propSchema) => {
    const cmt = (propSchema as JSONSchema7 & { contentMediaType?: string })
      .contentMediaType;
    return typeof cmt === "string" && cmt.startsWith("audio/");
  });
}

/** Convention-before-configuration: audio URI properties become play actions. */
export const playableAudioCardAction: CardActionEntry = {
  tester: rankWith(10, (_ui, schema) =>
    schemaHasAudioProperty(schema as JSONSchema7) ? 10 : -1,
  ),
  computeAction: (schema, data) => {
    if (!data || typeof data !== "object") return undefined;
    const match = findPlayableAudioProperty(
      schema,
      data as Record<string, unknown>,
    );
    if (!match) return undefined;
    return {
      id: `play:${match.name}`,
      label: "Play",
      intent: "custom",
      primary: true,
    };
  },
  renderer: PlayableAudioActionRenderer,
};

export const defaultCardActionRegistry: CardActionEntry[] = [
  playableAudioCardAction,
];
