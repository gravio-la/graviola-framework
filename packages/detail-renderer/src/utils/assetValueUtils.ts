import {
  assetKindForDetailSchema,
  type DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";
import type { AssetKind } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";

export function assetIriFromValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>)["@id"] === "string"
  ) {
    const id = (value as { "@id": string })["@id"];
    return id.length > 0 ? id : undefined;
  }
  return undefined;
}

export type AssetInlineMeta = {
  fileName?: string;
  encodingFormat?: string;
  contentSize?: number;
  caption?: string;
};

export function readAssetInlineMeta(value: unknown): AssetInlineMeta {
  if (!value || typeof value !== "object") return {};
  const o = value as Record<string, unknown>;
  const fileName =
    typeof o.fileName === "string"
      ? o.fileName
      : typeof o.name === "string"
        ? o.name
        : undefined;
  const encodingFormat =
    typeof o.encodingFormat === "string" ? o.encodingFormat : undefined;
  const contentSize =
    typeof o.contentSize === "number"
      ? o.contentSize
      : typeof o.byteSize === "number"
        ? o.byteSize
        : undefined;
  const caption = typeof o.caption === "string" ? o.caption : undefined;
  return { fileName, encodingFormat, contentSize, caption };
}

export function assetKindForValueSchema(
  schema: JSONSchema7,
  ctx: DetailTesterContext,
): AssetKind | undefined {
  return assetKindForDetailSchema(ctx, schema);
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function genericAssetLabel(iri: string, meta: AssetInlineMeta): string {
  if (meta.fileName) return meta.fileName;
  const tail = iri.split("/").filter(Boolean).pop();
  return tail && tail.length > 0 ? tail : iri;
}
