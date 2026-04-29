import type { JSONSchema7 } from "json-schema";

export function pickAnyOfBranch(
  branches: JSONSchema7[],
  data: unknown,
): JSONSchema7 | undefined {
  if (!branches?.length) return undefined;
  const prim = branches.find((b) => (b as JSONSchema7).const === data);
  if (prim) return prim as JSONSchema7;
  if (data && typeof data === "object") {
    const t = (data as Record<string, unknown>)["@type"];
    if (typeof t === "string") {
      const match = branches.find((b) => {
        const at = b.properties?.["@type"] as JSONSchema7 | undefined;
        return at?.const === t;
      });
      if (match) return match;
    }
  }
  return branches[0];
}

export function pickOneOfBranch(
  branches: JSONSchema7[],
  data: unknown,
): JSONSchema7 | undefined {
  if (!branches?.length) return undefined;
  const prim = branches.find((b) => (b as JSONSchema7).const === data);
  if (prim) return prim as JSONSchema7;
  if (data && typeof data === "object") {
    const t = (data as Record<string, unknown>)["@type"];
    if (typeof t === "string") {
      const match = branches.find((b) => {
        const at = b.properties?.["@type"] as JSONSchema7 | undefined;
        return at?.const === t;
      });
      if (match) return match;
    }
  }
  return branches[0];
}
