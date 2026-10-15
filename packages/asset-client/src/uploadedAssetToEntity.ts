import type { UploadedAsset } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";

export type UploadedAssetToEntityOptions = {
  iri: string;
  typeIRI: string;
  classSchema?: JSONSchema7;
  caption?: string;
};

function schemaPropertyNames(schema: JSONSchema7 | undefined): Set<string> {
  const names = new Set<string>(["@id", "@type"]);
  if (!schema || typeof schema !== "object") return names;
  const props = schema.properties;
  if (props && typeof props === "object") {
    for (const key of Object.keys(props)) names.add(key);
  }
  return names;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

/**
 * Map an {@link UploadedAsset} to a JSON-LD-ish entity document, optionally
 * filtered to properties declared on `classSchema`.
 */
export function uploadedAssetToEntity(
  asset: UploadedAsset,
  options: UploadedAssetToEntityOptions,
): Record<string, unknown> {
  const full: Record<string, unknown> = {
    "@id": options.iri,
    "@type": options.typeIRI,
    storageKey: asset.storageKey,
    fileName: asset.fileName,
    encodingFormat: asset.encodingFormat,
    contentSize: asset.contentSize,
    sha256: asset.sha256,
    width: asset.width,
    height: asset.height,
    uploadDate: asset.uploadDate,
    sourceUrl: asset.sourceUrl,
    caption: options.caption,
  };

  if (!options.classSchema) {
    return omitUndefined(full);
  }

  const allowed = schemaPropertyNames(options.classSchema);
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in full) filtered[key] = full[key];
  }
  return omitUndefined(filtered);
}
