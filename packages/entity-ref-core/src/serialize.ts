import type { EntityRef, SerializeEntityRefOptions } from "./types";
import { serializeWikilink } from "./wikilink";

/** Serialize an entity ref as markdown link syntax. */
export function serializeEntityRef(
  ref: EntityRef,
  options: SerializeEntityRefOptions = {},
): string {
  const syntax = options.syntax ?? "uri";
  const view = ref.view ?? options.defaultView;
  const withView = view && view !== "chip" ? { ...ref, view } : ref;

  if (syntax === "wikilink") {
    return `[[${serializeWikilink(withView)}]]`;
  }

  const typeName = withView.typeName;
  if (!typeName) {
    throw new Error(
      "serializeEntityRef(uri): typeName is required for URI syntax",
    );
  }

  const params = new URLSearchParams();
  if (withView.view && withView.view !== "chip") {
    params.set("view", withView.view);
  }
  if (withView.params) {
    for (const [key, value] of Object.entries(withView.params)) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  const href = `graviola:${typeName}/${withView.entityId}${query ? `?${query}` : ""}`;
  const label = withView.label ?? withView.entityId;
  return `[${label}](${href})`;
}
