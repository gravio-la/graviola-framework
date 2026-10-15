import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import { Resolve } from "@jsonforms/core";
import {
  resolveLinkedReferenceLabel,
  resolveLinkedReferenceLabelKey,
} from "@graviola/edb-core-utils";

import { parentPathForIdScopedControl } from "./relationalControlPathWrite";

export function readParentReferenceObject(
  coreData: unknown,
  path: string,
  idValue: unknown,
): Record<string, unknown> | undefined {
  if (path.endsWith("@id")) {
    const parentPath = parentPathForIdScopedControl(path);
    const parent = Resolve.data(coreData, parentPath);
    if (parent && typeof parent === "object" && !Array.isArray(parent)) {
      return parent as Record<string, unknown>;
    }
    if (typeof idValue === "string") {
      return { "@id": idValue };
    }
    return undefined;
  }
  if (idValue && typeof idValue === "object" && !Array.isArray(idValue)) {
    return idValue as Record<string, unknown>;
  }
  return undefined;
}

export function resolveRelationalDisplayLabel(input: {
  coreData: unknown;
  path: string;
  idValue: unknown;
  typeName: string | undefined;
  primaryFields: PrimaryFieldDeclaration;
  cachedLabel?: string | null;
}): string {
  const fromCache = input.cachedLabel?.trim();
  if (fromCache) return fromCache;

  const parent = readParentReferenceObject(
    input.coreData,
    input.path,
    input.idValue,
  );
  const labelKey = resolveLinkedReferenceLabelKey(
    input.typeName,
    input.primaryFields,
  );
  const fromData = resolveLinkedReferenceLabel({
    data: parent,
    typeName: input.typeName,
    primaryFields: input.primaryFields,
    labelKey,
  });
  if (fromData) return fromData;

  const id =
    typeof input.idValue === "string"
      ? input.idValue
      : typeof parent?.["@id"] === "string"
        ? parent["@id"]
        : undefined;
  return id ?? "";
}
