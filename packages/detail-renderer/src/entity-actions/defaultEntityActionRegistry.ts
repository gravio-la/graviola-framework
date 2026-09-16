import type { JSONSchema7 } from "json-schema";
import type { EntityActionEntry } from "@graviola/edb-detail-renderer-core";

function schemaHasAudioProperty(schema: JSONSchema7): boolean {
  const props = schema.properties ?? {};
  return Object.values(props).some((propSchema) => {
    const cmt = (propSchema as JSONSchema7 & { contentMediaType?: string })
      .contentMediaType;
    return typeof cmt === "string" && cmt.startsWith("audio/");
  });
}

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

export const showEntityAction: EntityActionEntry = {
  name: "graviola:show",
  surfaces: ["chip", "listItem", "card", "detail", "tableRow"],
  requiresCapabilities: ["open-in-modal"],
  tester: () => 20,
  build: (ctx) => {
    const target = ctx.targets[0];
    if (!target?.entityIRI) return undefined;
    return {
      id: "show",
      label: "Show",
      intent: "show",
      primary: true,
    };
  },
};

export const editEntityAction: EntityActionEntry = {
  name: "graviola:edit",
  surfaces: ["card", "detail", "tableRow"],
  requiresCapabilities: ["edit-entity"],
  tester: () => 15,
  build: (ctx) => {
    const target = ctx.targets[0];
    if (!target?.entityIRI || !target.typeName) return undefined;
    return {
      id: "edit",
      label: "Edit",
      intent: "edit",
    };
  },
};

export const openInNewTabAction: EntityActionEntry = {
  name: "graviola:open-in-new-tab",
  requiresCapabilities: ["open-in-new-tab"],
  tester: () => 12,
  build: () => ({
    id: "open-in-new-tab",
    label: "Open in new tab",
    intent: "open-in-new-tab",
    section: "Open",
  }),
};

export const openInWindowAction: EntityActionEntry = {
  name: "graviola:open-in-window",
  requiresCapabilities: ["open-in-window"],
  tester: () => 11,
  build: () => ({
    id: "open-in-window",
    label: "Open in new window",
    intent: "open-in-window",
    section: "Open",
  }),
};

export const openInRouteAction: EntityActionEntry = {
  name: "graviola:open-in-route",
  requiresCapabilities: ["open-in-route"],
  tester: () => 13,
  build: () => ({
    id: "open-in-route",
    label: "Open full screen",
    intent: "open-in-route",
    section: "Open",
  }),
};

export const playableAudioAction: EntityActionEntry = {
  name: "graviola:playable-audio",
  surfaces: ["card", "detail"],
  tester: (_schema, ctx) => (schemaHasAudioProperty(ctx.rootSchema) ? 10 : -1),
  build: (ctx) => {
    const target = ctx.targets[0];
    if (!target?.data || typeof target.data !== "object") return undefined;
    const match = findPlayableAudioProperty(
      ctx.rootSchema,
      target.data as Record<string, unknown>,
    );
    if (!match) return undefined;
    return {
      id: `play:${match.name}`,
      label: "Play",
      intent: "custom",
      primary: true,
    };
  },
};

export const defaultEntityActionRegistry: EntityActionEntry[] = [
  showEntityAction,
  editEntityAction,
  openInRouteAction,
  openInNewTabAction,
  openInWindowAction,
  playableAudioAction,
];
