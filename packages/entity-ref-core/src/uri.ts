import type { EntityRef } from "./types";

const GRAVIOLA_PREFIX = "graviola:";

/** Parse `graviola:TypeName/entity-id?view=chip` URIs. */
export function parseGraviolaUri(href: string): EntityRef | null {
  const trimmed = href.trim();
  if (!trimmed.toLowerCase().startsWith(GRAVIOLA_PREFIX)) {
    return null;
  }

  const rest = trimmed.slice(GRAVIOLA_PREFIX.length).replace(/^\/\//, "");
  const [pathPart, queryPart] = rest.split("?");
  const slash = pathPart.indexOf("/");
  if (slash <= 0) {
    return null;
  }

  const typeName = decodeURIComponent(pathPart.slice(0, slash));
  const entityId = decodeURIComponent(pathPart.slice(slash + 1));
  if (!typeName || !entityId) {
    return null;
  }

  const ref: EntityRef = { typeName, entityId };
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const view = params.get("view");
    if (view === "inline" || view === "chip" || view === "card") {
      ref.view = view;
    }
    const extra: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key !== "view") {
        extra[key] = value;
      }
    });
    if (Object.keys(extra).length > 0) {
      ref.params = extra;
    }
  }
  return ref;
}

/** True when href uses the graviola entity scheme. */
export function isGraviolaUri(href: string): boolean {
  return href.trim().toLowerCase().startsWith(GRAVIOLA_PREFIX);
}
