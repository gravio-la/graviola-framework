import type { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";
import type { JSONSchema7 } from "json-schema";

export function resolveDefaultPrefix(
  schema: JSONSchema7,
  explicit?: string,
): string {
  if (explicit) return explicit;
  const ctx = (schema as { "@context"?: { "@vocab"?: string } })["@context"];
  if (ctx && typeof ctx === "object" && typeof ctx["@vocab"] === "string") {
    return ctx["@vocab"];
  }
  if (typeof schema.$id === "string" && schema.$id.length > 0) {
    return schema.$id.endsWith("/") || schema.$id.endsWith("#")
      ? schema.$id
      : `${schema.$id}#`;
  }
  return "http://example.org/";
}

export function defaultTypeNameToTypeIRI(prefix: string): StringToIRIFn {
  return (typeName: string) => `${prefix}${typeName}`;
}

export function defaultTypeIRItoTypeName(prefix: string): IRIToStringFn {
  return (iri: string) =>
    iri.startsWith(prefix) ? iri.slice(prefix.length) : iri;
}

export function typeNamesFromSchema(schema: JSONSchema7): string[] {
  const defs = schema.definitions ?? (schema as { $defs?: object }).$defs;
  if (!defs || typeof defs !== "object") return [];
  return Object.keys(defs);
}

export function inferPrismaProvider(
  datasourceUrl: string,
  explicit?: string,
): string {
  if (explicit) return explicit;
  if (
    datasourceUrl.startsWith("file:") ||
    datasourceUrl.startsWith("sqlite:")
  ) {
    return "sqlite";
  }
  if (
    datasourceUrl.startsWith("postgres:") ||
    datasourceUrl.startsWith("postgresql:")
  ) {
    return "postgresql";
  }
  if (datasourceUrl.startsWith("mysql:")) return "mysql";
  if (datasourceUrl.startsWith("mongodb:")) return "mongodb";
  return "postgresql";
}
