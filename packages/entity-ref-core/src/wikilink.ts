import type { EntityRef } from "./types";

/** Obsidian-style `[[Type:id|label|view=chip]]` or `[[http://…/id|label]]`. */
export const WIKILINK_PATTERN =
  /\[\[([^\]|]+)(?:\|([^\]|]+))?(?:\|([^|\]]+))?\]\]/g;

function parseViewParam(
  segment: string | undefined,
): EntityRef["view"] | undefined {
  if (!segment) return undefined;
  const trimmed = segment.trim();
  if (trimmed.startsWith("view=")) {
    const view = trimmed.slice("view=".length);
    if (view === "inline" || view === "chip" || view === "card") {
      return view;
    }
  }
  return undefined;
}

function parseTarget(
  target: string,
): Pick<EntityRef, "typeName" | "entityId" | "entityIRI"> {
  const trimmed = target.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const slash = trimmed.lastIndexOf("/");
    const entityId = slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
    return { entityIRI: trimmed, entityId };
  }

  const colon = trimmed.indexOf(":");
  if (colon > 0) {
    return {
      typeName: trimmed.slice(0, colon),
      entityId: trimmed.slice(colon + 1),
    };
  }

  return { entityId: trimmed };
}

/** Parse one wikilink inner text (without brackets). */
export function parseWikilink(inner: string): EntityRef | null {
  const match = inner.match(/^([^\]|]+)(?:\|([^\]|]+))?(?:\|([^|\]]+))?$/);
  if (!match) {
    return null;
  }

  const [, target, labelOrView, maybeView] = match;
  const base = parseTarget(target);
  const ref: EntityRef = { ...base };

  const viewFromThird = parseViewParam(maybeView);
  if (viewFromThird) {
    ref.view = viewFromThird;
    if (labelOrView && !labelOrView.startsWith("view=")) {
      ref.label = labelOrView;
    }
  } else if (labelOrView) {
    const viewFromSecond = parseViewParam(labelOrView);
    if (viewFromSecond) {
      ref.view = viewFromSecond;
    } else {
      ref.label = labelOrView;
    }
  }

  return ref;
}

/** Serialize an entity ref as a wikilink string (without surrounding brackets). */
export function serializeWikilink(ref: EntityRef): string {
  const target =
    ref.typeName != null
      ? `${ref.typeName}:${ref.entityId}`
      : (ref.entityIRI ?? ref.entityId);

  const parts = [target];
  if (ref.label) {
    parts.push(ref.label);
  }
  if (ref.view && ref.view !== "chip") {
    parts.push(`view=${ref.view}`);
  } else if (ref.view === "chip" && ref.label) {
    parts.push("view=chip");
  }
  return parts.join("|");
}
