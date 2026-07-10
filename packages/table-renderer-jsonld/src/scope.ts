import { parsePropertyScopeSegments } from "@graviola/meta-schema";

export function scopeToPropertyKey(scope: string): string | undefined {
  const segments = parsePropertyScopeSegments(scope);
  return segments[0];
}

export function isNestedScope(scope: string): boolean {
  return parsePropertyScopeSegments(scope).length > 1;
}

export { parsePropertyScopeSegments };
