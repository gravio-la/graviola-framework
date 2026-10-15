import type {
  PrimaryField,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import type { AutocompleteSuggestion } from "@graviola/edb-core-types";
import {
  buildLinkedReferenceObject,
  resolveLinkedReferenceLabel,
  resolveLinkedReferenceLabelKey,
} from "@graviola/edb-core-utils";

export function parentPathForIdScopedControl(path: string): string {
  if (!path.endsWith("@id")) return path;
  return path.slice(0, -("@id".length + 1));
}

/** @deprecated Prefer {@link resolveLinkedReferenceLabelKey} from `@graviola/edb-core-utils`. */
export function resolveLabelKey(
  primaryFields: Record<string, PrimaryField | undefined>,
  typeName: string | undefined,
): string {
  return resolveLinkedReferenceLabelKey(typeName, primaryFields);
}

type HandleChange = (path: string, value: unknown) => void;

export function clearLinkedEntityAtPath(
  handleChange: HandleChange,
  path: string,
): void {
  if (path.endsWith("@id")) {
    const parentPath = parentPathForIdScopedControl(path);
    handleChange(parentPath === "" ? path : parentPath, undefined);
    return;
  }
  handleChange(path, undefined);
}

export function writeLinkedEntitySelection(
  handleChange: HandleChange,
  path: string,
  typeIRI: string | undefined,
  labelKey: string,
  v: AutocompleteSuggestion | null,
  options?: {
    typeName?: string;
    primaryFields?: PrimaryFieldDeclaration;
    entityData?: unknown;
  },
): void {
  if (!v) {
    clearLinkedEntityAtPath(handleChange, path);
    return;
  }
  const entity = buildLinkedReferenceObject({
    entityIRI: v.value,
    typeIRI,
    typeName: options?.typeName,
    primaryFields: options?.primaryFields,
    entityData: options?.entityData,
    suggestionLabel: v.label,
  });
  if (path.endsWith("@id")) {
    const parentPath = parentPathForIdScopedControl(path);
    if (parentPath === "") {
      handleChange(path, v.value);
      return;
    }
    handleChange(parentPath, entity);
    return;
  }
  handleChange(path, entity);
}

export async function resolveAcceptedLinkedEntityLabel(input: {
  entityIRI: string;
  acceptedData: unknown;
  typeName: string | undefined;
  primaryFields?: PrimaryFieldDeclaration;
  loadEntity?: (typeName: string, entityIRI: string) => Promise<unknown>;
}): Promise<{ label: string; entityData: Record<string, unknown> }> {
  let entityData: Record<string, unknown> =
    input.acceptedData && typeof input.acceptedData === "object"
      ? (input.acceptedData as Record<string, unknown>)
      : {};
  const labelKey = resolveLinkedReferenceLabelKey(
    input.typeName,
    input.primaryFields,
  );
  let label = resolveLinkedReferenceLabel({
    data: entityData,
    typeName: input.typeName,
    primaryFields: input.primaryFields,
    labelKey,
  });
  if (!label && input.typeName && input.loadEntity) {
    try {
      const loaded = await input.loadEntity(input.typeName, input.entityIRI);
      if (loaded && typeof loaded === "object") {
        entityData = loaded as Record<string, unknown>;
        label = resolveLinkedReferenceLabel({
          data: entityData,
          typeName: input.typeName,
          primaryFields: input.primaryFields,
          labelKey,
        });
      }
    } catch {
      /* entity may not exist locally yet */
    }
  }
  return { label: label ?? input.entityIRI, entityData };
}

export function writeLinkedEntityFromModalData(
  handleChange: HandleChange,
  path: string,
  labelKey: string,
  data: Record<string, unknown>,
  options?: {
    typeName?: string;
    primaryFields?: PrimaryFieldDeclaration;
  },
): void {
  if (path.endsWith("@id")) {
    const parentPath = parentPathForIdScopedControl(path);
    const id = data["@id"];
    if (parentPath === "") {
      handleChange(path, typeof id === "string" ? id : undefined);
      return;
    }
    const entity: Record<string, unknown> = { ...data };
    delete entity.__label;
    const modalLabel =
      (typeof data.label === "string" && data.label) ||
      resolveLinkedReferenceLabel({
        data,
        typeName: options?.typeName,
        primaryFields: options?.primaryFields,
        labelKey,
      });
    if (typeof modalLabel === "string" && modalLabel.length > 0) {
      entity[labelKey] = modalLabel;
    }
    handleChange(parentPath, entity);
    return;
  }
  handleChange(path, data);
}
