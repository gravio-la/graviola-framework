import type { PrimaryField } from "@graviola/edb-core-types";
import type { AutocompleteSuggestion } from "@graviola/edb-core-types";

export function parentPathForIdScopedControl(path: string): string {
  if (!path.endsWith("@id")) return path;
  return path.slice(0, -("@id".length + 1));
}

export function resolveLabelKey(
  primaryFields: Record<string, PrimaryField | undefined>,
  typeName: string | undefined,
): string {
  if (!typeName) return "title";
  const fieldDecl = primaryFields[typeName];
  const lk = fieldDecl?.label;
  return typeof lk === "string" ? lk : "title";
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
): void {
  if (!v) {
    clearLinkedEntityAtPath(handleChange, path);
    return;
  }
  if (path.endsWith("@id")) {
    const parentPath = parentPathForIdScopedControl(path);
    if (parentPath === "") {
      handleChange(path, v.value);
      return;
    }
    handleChange(parentPath, {
      "@id": v.value,
      "@type": typeIRI,
      [labelKey]: v.label ?? v.value,
    });
    return;
  }
  handleChange(path, {
    "@id": v.value,
    "@type": typeIRI,
    [labelKey]: v.label ?? v.value,
  });
}

export function writeLinkedEntityFromModalData(
  handleChange: HandleChange,
  path: string,
  labelKey: string,
  data: Record<string, unknown>,
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
    const modalLabel = data.label;
    if (typeof modalLabel === "string" && modalLabel.length > 0) {
      entity[labelKey] = modalLabel;
    }
    handleChange(parentPath, entity);
    return;
  }
  handleChange(path, data);
}
