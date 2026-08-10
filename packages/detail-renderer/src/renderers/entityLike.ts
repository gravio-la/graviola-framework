/** Shared entity-shape helpers for detail array / article renderers. */

export function hasStableEntityId(obj: Record<string, unknown>): boolean {
  const id = obj["@id"];
  return typeof id === "string" && id.length > 0;
}

export function isEntityLikeData(obj: Record<string, unknown>): boolean {
  return typeof obj["@type"] === "string" || hasStableEntityId(obj);
}
