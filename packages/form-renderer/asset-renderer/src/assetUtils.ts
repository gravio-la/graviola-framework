import { AssetHttpError } from "@graviola/asset-client";
import type { AssetKind } from "@graviola/edb-core-types";
import {
  assetKindForRef,
  resolveSchema,
  type JsonSchema,
  type SchemaRegistry,
} from "@graviola/json-schema-utils";
import type { ControlProps } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

export function jsonFormsConfig(context: { config?: Record<string, unknown> }) {
  return context.config ?? {};
}

function typeConstFromSchema(s: JSONSchema7 | undefined): string | undefined {
  const atType = s?.properties?.["@type"];
  if (!atType || typeof atType !== "object" || Array.isArray(atType)) {
    return undefined;
  }
  const c = (atType as JSONSchema7).const;
  return typeof c === "string" ? c : undefined;
}

export function assetIriFromValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as any)["@id"] === "string"
  ) {
    return (value as { "@id": string })["@id"];
  }
  return undefined;
}

export function assetErrorMessage(error: unknown): string {
  if (error instanceof AssetHttpError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

export type AssetControlMeta = {
  kind: AssetKind;
  typeIRI: string | undefined;
  typeName: string | undefined;
  classSchema: JSONSchema7 | undefined;
  registry: SchemaRegistry | undefined;
};

export function resolveAssetControlMeta(
  props: Pick<ControlProps, "schema" | "rootSchema" | "config">,
  ctxConfig: Record<string, unknown> | undefined,
  typeIRIToTypeName: (iri: string) => string | undefined,
): AssetControlMeta {
  const mergedConfig = { ...(props.config ?? {}), ...(ctxConfig ?? {}) };
  const registry = mergedConfig.registry as SchemaRegistry | undefined;
  const schema = props.schema as JSONSchema7;
  const kind = assetKindForRef({ config: mergedConfig }, schema);
  if (!kind) {
    return {
      kind: "file",
      typeIRI: undefined,
      typeName: undefined,
      classSchema: undefined,
      registry,
    };
  }

  const ref = schema.$ref;
  let typeIRI: string | undefined = typeConstFromSchema(schema);
  let classSchema: JSONSchema7 | undefined;

  if (registry && ref) {
    const entry = registry.byPath.get(ref);
    if (entry) {
      typeIRI = typeIRI ?? entry.typeIRI;
      classSchema = {
        ...(props.rootSchema as object),
        ...entry.resolvedSchema,
      } as JSONSchema7;
    }
  }
  if (!classSchema && ref) {
    const resolved = resolveSchema(
      { ...schema } as JsonSchema,
      "",
      props.rootSchema as JsonSchema,
    );
    classSchema = {
      ...(props.rootSchema as object),
      ...(resolved as JSONSchema7),
    } as JSONSchema7;
    typeIRI = typeIRI ?? typeConstFromSchema(resolved as JSONSchema7);
  }

  const typeName =
    typeIRI !== undefined ? typeIRIToTypeName(typeIRI) : undefined;

  return { kind, typeIRI, typeName, classSchema, registry };
}

export function classHasCaption(classSchema: JSONSchema7 | undefined): boolean {
  return Boolean(classSchema?.properties?.caption);
}

export function acceptAttribute(
  kind: AssetKind,
  assetService: { accept?: Partial<Record<AssetKind, string[]>> } | undefined,
): string | undefined {
  const fromService = assetService?.accept?.[kind];
  if (fromService?.length) return fromService.join(",");
  if (kind === "image") return "image/*";
  return undefined;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
  );
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
