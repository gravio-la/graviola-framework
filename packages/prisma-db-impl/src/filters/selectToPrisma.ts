import type { JSONSchema7 } from "json-schema";
import { jsonSchema2PrismaSelect } from "@graviola/json-schema-prisma-utils";

import { whereToPrisma, type WhereToPrismaOptions } from "./whereToPrisma.js";

export type SelectToPrismaOptions = WhereToPrismaOptions & {
  maxRecursion?: number;
  schema?: JSONSchema7;
  typeName?: string;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v != null && typeof v === "object" && !Array.isArray(v);

/**
 * Ensure every select level includes `id` and `type` so toJSONLD can rebuild @id/@type.
 */
function ensureIdentityFields(
  select: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...select, id: true, type: true };
  for (const [key, value] of Object.entries(out)) {
    if (
      isPlainObject(value) &&
      "select" in value &&
      isPlainObject(value.select)
    ) {
      out[key] = {
        ...value,
        select: ensureIdentityFields(value.select as Record<string, unknown>),
      };
    }
  }
  return out;
}

/**
 * Map TypedSelectPattern `{ name: true, price: true }` → Prisma select.
 * Always injects `id` and `type`.
 */
export function selectToPrisma(
  select: Record<string, boolean | unknown> | undefined,
  _options: SelectToPrismaOptions = {},
): Record<string, unknown> | undefined {
  if (!select) return undefined;
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (key === "@id") {
      mapped.id = Boolean(value);
      continue;
    }
    if (key === "@type") {
      mapped.type = Boolean(value);
      continue;
    }
    mapped[key] = value === true ? true : Boolean(value);
  }
  return ensureIdentityFields(mapped);
}

export type NestedIncludeValue =
  | boolean
  | {
      select?: Record<string, boolean>;
      include?: Record<string, NestedIncludeValue>;
      where?: unknown;
      take?: number;
      skip?: number;
      orderBy?: unknown;
      maxRecursion?: number;
      omit?: unknown;
    };

/**
 * Map TypedIncludePattern to Prisma `select` (we use select exclusively so
 * projection and relation nesting share one shape).
 *
 * Nested `take` / `skip` / `orderBy` / `where` are honoured natively.
 * `maxRecursion: 0` yields only identity stubs (`id` + `type`).
 */
export function includeToPrisma(
  include: Record<string, NestedIncludeValue> | undefined,
  options: SelectToPrismaOptions = {},
  depth = 0,
): Record<string, unknown> | undefined {
  if (!include) return undefined;

  const globalMax = options.maxRecursion ?? 4;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(include)) {
    if (value === true) {
      // Prisma `true` includes all scalar fields of the related model.
      // Cap depth with an identity-only stub when recursion is exhausted.
      result[key] =
        depth >= globalMax ? { select: { id: true, type: true } } : true;
      continue;
    }

    if (value === false || value == null) continue;

    if (isPlainObject(value)) {
      const branchMax =
        typeof value.maxRecursion === "number"
          ? Math.min(value.maxRecursion, globalMax - depth)
          : globalMax - depth;

      if (branchMax <= 0) {
        // Stub only — still allow orderBy scalars via select of id/type + orderBy fields
        const stubSelect: Record<string, unknown> = { id: true, type: true };
        if (value.orderBy) {
          for (const clause of Array.isArray(value.orderBy)
            ? value.orderBy
            : [value.orderBy]) {
            if (isPlainObject(clause)) {
              for (const field of Object.keys(clause)) {
                stubSelect[field] = true;
              }
            }
          }
        }
        const branch: Record<string, unknown> = {
          select: stubSelect,
        };
        if (value.take != null) branch.take = value.take;
        if (value.skip != null) branch.skip = value.skip;
        if (value.orderBy != null) branch.orderBy = value.orderBy;
        if (value.where != null) {
          branch.where = whereToPrisma(value.where, options);
        }
        result[key] = branch;
        continue;
      }

      let nestedSelect: Record<string, unknown> | undefined;
      if (value.select) {
        nestedSelect = selectToPrisma(value.select, options);
      } else if (value.include) {
        const nestedInclude = includeToPrisma(
          value.include as Record<string, NestedIncludeValue>,
          { ...options, maxRecursion: branchMax },
          depth + 1,
        );
        nestedSelect = ensureIdentityFields({
          ...(nestedInclude ?? {}),
        });
        // When only include is given, also need scalar defaults — keep identity + nested
      } else {
        nestedSelect = { id: true, type: true };
      }

      // Merge nested include keys into select
      if (value.include && value.select) {
        const nestedInclude = includeToPrisma(
          value.include as Record<string, NestedIncludeValue>,
          { ...options, maxRecursion: branchMax },
          depth + 1,
        );
        nestedSelect = ensureIdentityFields({
          ...(nestedSelect ?? {}),
          ...(nestedInclude ?? {}),
        });
      }

      const branch: Record<string, unknown> = {
        select: nestedSelect ?? { id: true, type: true },
      };
      if (value.take != null) branch.take = value.take;
      if (value.skip != null) branch.skip = value.skip;
      if (value.orderBy != null) branch.orderBy = value.orderBy;
      if (value.where != null) {
        branch.where = whereToPrisma(value.where, options);
      }
      result[key] = branch;
    }
  }

  return result;
}

/**
 * Build the final Prisma `select` for a filterMany/filterOne call.
 *
 * - No select/include → schema-driven full select (via jsonSchema2PrismaSelect)
 *   when `includeRelationsByDefault` is true; otherwise scalars-only from schema
 *   with relations omitted (Prisma-like default).
 * - With select → projected fields (+ identity)
 * - With include → relations nested; scalars from schema unless select given
 */
export function buildPrismaSelectArgs(
  typeName: string,
  schema: JSONSchema7,
  options: {
    select?: Record<string, boolean>;
    include?: Record<string, NestedIncludeValue>;
    includeRelationsByDefault?: boolean;
    maxRecursion?: number;
  } & WhereToPrismaOptions,
): { select: Record<string, unknown> } {
  const maxRecursion = options.maxRecursion ?? 4;
  const whereOpts: WhereToPrismaOptions = {
    IRItoId: options.IRItoId,
    typeIRItoTypeName: options.typeIRItoTypeName,
    supportsStringMode: options.supportsStringMode,
  };

  if (options.select && !options.include) {
    return {
      select: selectToPrisma(options.select, whereOpts) ?? {
        id: true,
        type: true,
      },
    };
  }

  if (options.include) {
    const included = includeToPrisma(options.include, {
      ...whereOpts,
      maxRecursion,
      schema,
      typeName,
    });

    // Base scalars: either from explicit select, or schema without relations
    let base: Record<string, unknown>;
    if (options.select) {
      base = selectToPrisma(options.select, whereOpts) ?? {
        id: true,
        type: true,
      };
    } else {
      // Scalars only from schema (maxRecursion 0 → no relations)
      const full = jsonSchema2PrismaSelect(typeName, schema, {
        maxRecursion: 0,
      }) as Record<string, unknown> | null;
      base = ensureIdentityFields(full ?? { id: true, type: true });
      // Strip any residual relation objects from maxRecursion 0
      for (const [k, v] of Object.entries(base)) {
        if (isPlainObject(v)) delete base[k];
      }
      base.id = true;
      base.type = true;
    }

    return {
      select: ensureIdentityFields({
        ...base,
        ...(included ?? {}),
      }),
    };
  }

  // Default: Prisma-like — no relations unless includeRelationsByDefault
  const recursion = options.includeRelationsByDefault ? maxRecursion : 0;
  const full = jsonSchema2PrismaSelect(typeName, schema, {
    maxRecursion: recursion,
  }) as Record<string, unknown> | null;

  return {
    select: ensureIdentityFields(full ?? { id: true, type: true }),
  };
}
