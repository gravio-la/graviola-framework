/** Decode one JSON Pointer segment */
function decodeSeg(pointerSegment: string): string {
  return pointerSegment.replace(/~1/g, "/").replace(/~0/g, "~");
}

/**
 * Walk instance data using a JSON Schema scope pointer (e.g. `#/properties/foo/properties/bar`).
 */
export function dataAtScope(
  rootData: unknown,
  scope: string | undefined,
): unknown {
  if (scope == null || scope === "" || scope === "#") return rootData;
  const trimmed = scope.startsWith("#") ? scope.slice(1) : scope;
  const segments = trimmed.split("/").filter(Boolean).map(decodeSeg);
  const dataPath: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "properties" && segments[i + 1] !== undefined) {
      dataPath.push(segments[i + 1]);
      i++;
      continue;
    }
    // `items` describes array member schema and does not advance instance path.
    if (seg === "items") continue;
    dataPath.push(seg);
  }
  let cur: unknown = rootData;
  for (const seg of dataPath) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** Dot-path segments from scope, e.g. `["author","birthDate"]`. */
export function pathFromScope(scope: string | undefined): string[] {
  if (!scope || scope === "#") return [];
  const trimmed = scope.startsWith("#") ? scope.slice(1) : scope;
  const segments = trimmed.split("/").filter(Boolean);
  const path: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === "properties" && segments[i + 1] !== undefined) {
      path.push(decodeSeg(segments[i + 1]));
      i++;
    }
  }
  return path;
}

/** Append a property segment to a JSON Pointer scope. */
export function extendPropertyScope(
  parentScope: string | undefined,
  propKey: string,
): string {
  const base =
    !parentScope || parentScope === "#"
      ? "#/properties"
      : parentScope.endsWith("/properties")
        ? parentScope
        : `${parentScope}/properties`;
  const enc = propKey.replace(/~/g, "~0").replace(/\//g, "~1");
  return `${base}/${enc}`;
}
