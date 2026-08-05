import type { IRIToStringFn } from "@graviola/edb-core-types";
import type {
  PersistenceManifest,
  PersistencePropertyDescriptor,
} from "@graviola/json-schema-prisma-utils";

export type WhereToPrismaOptions = {
  /** Map JSON-LD `@id` IRIs to Prisma `id` column values. */
  IRItoId?: IRIToStringFn;
  /** Map JSON-LD `@type` IRIs to Prisma `type` column values. */
  typeIRItoTypeName?: IRIToStringFn;
  /**
   * When false, strip `mode: "insensitive"` from string filters
   * (SQLite / MySQL reject it). Default true.
   */
  supportsStringMode?: boolean;
  /** Persistence manifest for multi-value list filter expansion. */
  persistenceManifest?: PersistenceManifest;
  /** Current type name for looking up property descriptors. */
  typeName?: string;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v != null && typeof v === "object" && !Array.isArray(v);

const isNodeReference = (v: unknown): v is { "@id": string } =>
  isPlainObject(v) &&
  typeof v["@id"] === "string" &&
  Object.keys(v).every((k) => k === "@id" || k === "@type");

const mapId = (iri: string, options: WhereToPrismaOptions): string =>
  options.IRItoId ? options.IRItoId(iri) : iri;

const SCALAR_OPS = new Set([
  "equals",
  "not",
  "in",
  "notIn",
  "lt",
  "lte",
  "gt",
  "gte",
  "contains",
  "startsWith",
  "endsWith",
  "mode",
]);

function isScalarFilterObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => SCALAR_OPS.has(k));
}

/**
 * Expand a JSON-LD-surface filter on a multi-value property into the Prisma shape.
 *
 * childTable primitive: `{ contains: "x" }` → `{ some: { value: { contains: "x" } } }`
 * scalarList: equality → `has` / `hasSome`; `contains` throws.
 * embedded / childTable anonymous: pass through (some/every/none already valid).
 */
function expandListFilter(
  value: unknown,
  desc: PersistencePropertyDescriptor,
  options: WhereToPrismaOptions,
): unknown {
  if (desc.representation === "childTable" && desc.valueType) {
    // Already relation-shaped?
    if (
      isPlainObject(value) &&
      ("some" in value || "every" in value || "none" in value)
    ) {
      const nested: Record<string, unknown> = {};
      for (const [rk, rv] of Object.entries(value)) {
        if (rk === "some" || rk === "every" || rk === "none") {
          // If the nested filter is scalar ops, wrap under `value`
          if (isPlainObject(rv) && isScalarFilterObject(rv)) {
            nested[rk] = { value: whereToPrisma(rv, options, "scalar") };
          } else if (!isPlainObject(rv) || !("value" in rv)) {
            // Bare equality / primitive
            nested[rk] = {
              value: whereToPrisma(rv, options, "scalar"),
            };
          } else {
            nested[rk] = whereToPrisma(rv, options, "scalar");
          }
        } else {
          nested[rk] = whereToPrisma(rv, options, "scalar");
        }
      }
      return nested;
    }

    // Sugar: photos: { contains: "x" } or photos: { equals: "x" }
    if (isPlainObject(value) && isScalarFilterObject(value)) {
      return { some: { value: whereToPrisma(value, options, "scalar") } };
    }

    // Sugar: photos: "exact"
    return { some: { value: value } };
  }

  if (desc.representation === "scalarList") {
    if (
      isPlainObject(value) &&
      ("some" in value || "every" in value || "none" in value)
    ) {
      throw new Error(
        `Relation filters (some/every/none) are not valid on scalarList property; use has / hasSome / hasEvery / isEmpty`,
      );
    }
    if (isPlainObject(value) && isScalarFilterObject(value)) {
      if ("contains" in value || "startsWith" in value || "endsWith" in value) {
        throw new Error(
          `Substring filters (contains/startsWith/endsWith) are not supported on scalarList properties (Mongo/Postgres native arrays). Use childTable representation or equality via has/hasSome.`,
        );
      }
      if ("equals" in value) {
        return { has: value.equals };
      }
      if ("in" in value && Array.isArray(value.in)) {
        return { hasSome: value.in };
      }
      return value; // has, hasSome, hasEvery, isEmpty pass through
    }
    // Bare value → has
    return { has: value };
  }

  // embedded / childTable anonymous — recurse normally
  return whereToPrisma(value, options, "many");
}

/**
 * Convert a Prisma-shaped TypedWhereInput (JSON-LD keys) into a Prisma `where` clause.
 */
export function whereToPrisma(
  where: unknown,
  options: WhereToPrismaOptions = {},
  /** Hint: when mapping a relation filter value that is a bare NodeReference. */
  relationCardinality: "one" | "many" | "scalar" = "scalar",
): unknown {
  if (where == null) return where;

  if (isNodeReference(where)) {
    const id = mapId(where["@id"], options);
    if (relationCardinality === "many") {
      return { some: { id } };
    }
    return { id };
  }

  if (Array.isArray(where)) {
    return where.map((item) =>
      whereToPrisma(item, options, relationCardinality),
    );
  }

  if (!isPlainObject(where)) {
    return where;
  }

  const result: Record<string, unknown> = {};
  const typeManifest = options.typeName
    ? options.persistenceManifest?.types?.[options.typeName]
    : undefined;

  for (const [key, value] of Object.entries(where)) {
    if (key === "AND" || key === "OR" || key === "NOT") {
      result[key] = whereToPrisma(value, options, "scalar");
      continue;
    }

    if (key === "some" || key === "every" || key === "none") {
      result[key] = whereToPrisma(value, options, "scalar");
      continue;
    }

    if (key === "@id") {
      result.id = mapWhereIdValue(value, options);
      continue;
    }

    if (key === "@type") {
      result.type = mapWhereTypeValue(value, options);
      continue;
    }

    if (
      key === "mode" &&
      value === "insensitive" &&
      !options.supportsStringMode
    ) {
      continue;
    }

    const desc = typeManifest?.[key];
    if (
      desc &&
      (desc.representation === "childTable" ||
        desc.representation === "scalarList" ||
        desc.representation === "embedded")
    ) {
      result[key] = expandListFilter(value, desc, options);
      continue;
    }

    if (isNodeReference(value)) {
      result[key] = whereToPrisma(value, options, "many");
      continue;
    }

    if (isPlainObject(value)) {
      const hasRelationOps =
        "some" in value || "every" in value || "none" in value;
      if (hasRelationOps) {
        const nested: Record<string, unknown> = {};
        for (const [rk, rv] of Object.entries(value)) {
          nested[rk] = whereToPrisma(rv, options, "scalar");
        }
        result[key] = nested;
        continue;
      }

      if (
        "mode" in value &&
        value.mode === "insensitive" &&
        !options.supportsStringMode
      ) {
        const { mode: _mode, ...rest } = value;
        result[key] = whereToPrisma(rest, options, "scalar");
        continue;
      }

      if (
        Object.keys(value).some(
          (k) =>
            k.startsWith("@") ||
            k === "AND" ||
            k === "OR" ||
            k === "NOT" ||
            isPlainObject(value[k]) ||
            isNodeReference(value[k]),
        )
      ) {
        result[key] = whereToPrisma(value, options, "scalar");
        continue;
      }

      result[key] = whereToPrisma(value, options, "scalar");
      continue;
    }

    result[key] = value;
  }

  return result;
}

function mapWhereIdValue(
  value: unknown,
  options: WhereToPrismaOptions,
): unknown {
  if (typeof value === "string") {
    return mapId(value, options);
  }
  if (isPlainObject(value)) {
    const mapped: Record<string, unknown> = {};
    for (const [op, v] of Object.entries(value)) {
      if (typeof v === "string") {
        mapped[op] = mapId(v, options);
      } else if (Array.isArray(v)) {
        mapped[op] = v.map((item) =>
          typeof item === "string" ? mapId(item, options) : item,
        );
      } else {
        mapped[op] = v;
      }
    }
    return mapped;
  }
  return value;
}

function mapWhereTypeValue(
  value: unknown,
  options: WhereToPrismaOptions,
): unknown {
  const mapType = (iri: string) =>
    options.typeIRItoTypeName ? options.typeIRItoTypeName(iri) : iri;

  if (typeof value === "string") {
    return mapType(value);
  }
  if (isPlainObject(value)) {
    const mapped: Record<string, unknown> = {};
    for (const [op, v] of Object.entries(value)) {
      if (typeof v === "string") {
        mapped[op] = mapType(v);
      } else if (Array.isArray(v)) {
        mapped[op] = v.map((item) =>
          typeof item === "string" ? mapType(item) : item,
        );
      } else {
        mapped[op] = v;
      }
    }
    return mapped;
  }
  return value;
}
