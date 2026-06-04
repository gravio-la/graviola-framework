import type { SchemaScopeFrame } from "@graviola/json-schema-utils";
import {
  dataInFrame as dataInFrameFromWalker,
  enterArrayDetailFrame,
  enterPropertyFrame,
  resolveInFrame,
  rootFrame,
  scopeToDataPathSegments,
} from "@graviola/json-schema-utils";

export {
  enterArrayDetailFrame,
  enterPropertyFrame,
  resolveInFrame,
  rootFrame,
  scopeToDataPathSegments,
};
export type { SchemaScopeFrame };

/** @deprecated Use {@link dataInFrame} with a {@link SchemaScopeFrame} from `@graviola/json-schema-utils`. */
export function dataAtScope(
  rootData: unknown,
  scope: string | undefined,
  rootSchema?: import("json-schema").JSONSchema7,
): unknown {
  if (!rootSchema) {
    const trimmed = scope?.startsWith("#") ? scope.slice(1) : (scope ?? "");
    const segments = trimmed.split("/").filter(Boolean);
    const dataPath: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      if (segments[i] === "properties" && segments[i + 1]) {
        dataPath.push(
          decodeURIComponent(
            segments[i + 1].replace(/~1/g, "/").replace(/~0/g, "~"),
          ),
        );
        i++;
      }
    }
    let cur: unknown = rootData;
    for (const seg of dataPath) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = (cur as Record<string, unknown>)[seg];
    }
    return cur;
  }
  const frame = rootFrame(rootSchema);
  let current = frame;
  const pathSegs = scopeToDataPathSegments(scope);
  for (const seg of pathSegs) {
    if (typeof seg === "string") {
      current = enterPropertyFrame(current, seg);
    }
  }
  return dataInFrameFromWalker(current, rootData);
}

export function dataInFrame(
  frame: SchemaScopeFrame,
  rootData: unknown,
): unknown {
  return dataInFrameFromWalker(frame, rootData);
}

/** Dot-path segments from scope, e.g. `["author","birthDate"]`. */
export function pathFromScope(scope: string | undefined): string[] {
  return scopeToDataPathSegments(scope);
}

/** Append a property segment to a JSON Pointer scope. */
export function extendPropertyScope(
  parentScope: string | undefined,
  propKey: string,
): string {
  const enc = propKey.replace(/~/g, "~0").replace(/\//g, "~1");
  const base =
    !parentScope || parentScope === "#"
      ? "#/properties"
      : parentScope.endsWith("/properties")
        ? parentScope
        : `${parentScope}/properties`;
  return `${base}/${enc}`;
}
