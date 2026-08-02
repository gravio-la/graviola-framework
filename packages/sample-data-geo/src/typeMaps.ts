import { GEO_VOCAB_BASE } from "./schema";

export const geoTypeNames = ["Place", "City", "Region", "Country"] as const;
export type GeoTypeName = (typeof geoTypeNames)[number];

export function geoTypeNameToTypeIRI(typeName: string): string {
  return `${GEO_VOCAB_BASE}${typeName}`;
}

export function geoTypeIRIToTypeName(iri: string): string | undefined {
  if (!iri.startsWith(GEO_VOCAB_BASE)) return undefined;
  return iri.slice(GEO_VOCAB_BASE.length) || undefined;
}
