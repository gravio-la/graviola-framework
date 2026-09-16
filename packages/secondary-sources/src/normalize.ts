import { getViaSourcePath } from "@graviola/edb-data-mapping";
import get from "lodash-es/get";

import type { Candidate, SearchShape } from "./types";

const defaultLabelPaths = ["title", "name", "label", "preferredName"];
const defaultIdPaths = ["id", "key", "@id"];
const defaultDescPaths = ["description", "desc"];

function pickPath(
  item: unknown,
  path?: string,
  fallbacks: string[] = [],
): string | undefined {
  if (path) {
    const v = getViaSourcePath(item, path);
    if (v != null && v !== "") return String(v);
  }
  for (const p of fallbacks) {
    const v = get(item, p);
    if (v != null && v !== "") return String(v);
  }
  return undefined;
}

export function extractItems(
  raw: unknown,
  itemsPath?: string | string[],
): unknown[] {
  if (!itemsPath) {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.result)) return obj.result;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.results)) return obj.results;
    }
    return [];
  }
  const items = getViaSourcePath(raw, itemsPath);
  return Array.isArray(items) ? items : items ? [items] : [];
}

export function normalizeCandidate(
  item: unknown,
  shape: SearchShape,
  authorityIRI: string,
  idToIri?: string,
): Candidate | null {
  const id = pickPath(item, shape.idPath, defaultIdPaths);
  const label = pickPath(item, shape.labelPath, defaultLabelPaths);
  if (!id && !label) return null;

  const resolvedId = id ?? label ?? "";
  let iri = resolvedId;
  if (idToIri) {
    iri = idToIri.replace("{{id}}", resolvedId);
  } else if (!resolvedId.startsWith("http")) {
    iri = `${authorityIRI.replace(/\/$/, "")}/${resolvedId}`;
  }

  return {
    id: resolvedId,
    iri,
    label: label ?? resolvedId,
    description: pickPath(item, shape.descriptionPath, defaultDescPaths),
    thumbnail: pickPath(item, shape.thumbnailPath, [
      "thumbnail.url",
      "thumbnail",
    ]),
    raw: item,
  };
}

export function normalizeCandidates(
  items: unknown[],
  shape: SearchShape,
  authorityIRI: string,
  idToIri?: string,
): Candidate[] {
  return items
    .map((item) => normalizeCandidate(item, shape, authorityIRI, idToIri))
    .filter((c): c is Candidate => c != null);
}
