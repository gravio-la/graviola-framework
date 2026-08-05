import type { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";
import type { PersistenceManifest } from "@graviola/json-schema-prisma-utils";
import type { StoreDocumentsSearchOptions } from "@graviola/store-core";
import type { JSONSchema7 } from "json-schema";

import type { AbstractPrismaClient } from "../types.js";
import { expandSelectWithManifest, toJSONLD } from "../helper/toJSONLD.js";
import { buildPrismaSelectArgs } from "./selectToPrisma.js";
import { whereToPrisma } from "./whereToPrisma.js";

export type FilterPrismaContext = {
  prisma: AbstractPrismaClient;
  schema: JSONSchema7;
  IRItoId?: IRIToStringFn;
  idToIRI?: StringToIRIFn;
  typeNameToTypeIRI: StringToIRIFn;
  typeIRItoTypeName: IRIToStringFn;
  supportsStringMode: boolean;
  maxRecursionDepth: number;
  persistenceManifest?: PersistenceManifest;
  typeName?: string;
};

function mapRows(
  rows: unknown[],
  ctx: FilterPrismaContext,
  typeName: string,
): Record<string, unknown>[] {
  return rows.map((entry) =>
    toJSONLD(entry, new WeakSet(), {
      idToIRI: ctx.idToIRI,
      typeNameToTypeIRI: ctx.typeNameToTypeIRI,
      persistenceManifest: ctx.persistenceManifest,
      typeName,
    }),
  );
}

function whereOpts(ctx: FilterPrismaContext, typeName: string) {
  return {
    IRItoId: ctx.IRItoId,
    typeIRItoTypeName: ctx.typeIRItoTypeName,
    supportsStringMode: ctx.supportsStringMode,
    persistenceManifest: ctx.persistenceManifest,
    typeName,
  };
}

export async function filterManyPrisma(
  typeName: string,
  options: StoreDocumentsSearchOptions<unknown> | undefined,
  ctx: FilterPrismaContext,
): Promise<Record<string, unknown>[]> {
  const wopts = whereOpts(ctx, typeName);

  const prismaWhere = options?.where
    ? whereToPrisma(options.where, wopts)
    : undefined;

  const { select: baseSelect } = buildPrismaSelectArgs(typeName, ctx.schema, {
    select: options?.select as Record<string, boolean> | undefined,
    include: options?.include as never,
    includeRelationsByDefault: options?.includeRelationsByDefault,
    maxRecursion: options?.maxRecursion ?? ctx.maxRecursionDepth,
    ...wopts,
  });

  const select = expandSelectWithManifest(
    baseSelect,
    typeName,
    ctx.persistenceManifest,
  );

  const take =
    options?.limit ??
    (options as { take?: number } | undefined)?.take ??
    undefined;
  const skip = (options as { skip?: number } | undefined)?.skip;
  const orderBy = (options as { orderBy?: unknown } | undefined)?.orderBy;

  const rows = await ctx.prisma[typeName].findMany({
    where: prismaWhere,
    select,
    ...(take != null ? { take } : {}),
    ...(skip != null ? { skip } : {}),
    ...(orderBy != null ? { orderBy } : {}),
  });

  return mapRows(rows, ctx, typeName);
}

export async function filterOnePrisma(
  typeName: string,
  entityIRI: string,
  options: StoreDocumentsSearchOptions<unknown> | undefined,
  ctx: FilterPrismaContext,
): Promise<Record<string, unknown> | null> {
  const id = ctx.IRItoId ? ctx.IRItoId(entityIRI) : entityIRI;
  const wopts = whereOpts(ctx, typeName);

  const userWhere = options?.where
    ? whereToPrisma(options.where, wopts)
    : undefined;

  const prismaWhere =
    userWhere && typeof userWhere === "object"
      ? { AND: [{ id }, userWhere] }
      : { id };

  const { select: baseSelect } = buildPrismaSelectArgs(typeName, ctx.schema, {
    select: options?.select as Record<string, boolean> | undefined,
    include: options?.include as never,
    includeRelationsByDefault: options?.includeRelationsByDefault,
    maxRecursion: options?.maxRecursion ?? ctx.maxRecursionDepth,
    ...wopts,
  });

  const select = expandSelectWithManifest(
    baseSelect,
    typeName,
    ctx.persistenceManifest,
  );

  const row = await ctx.prisma[typeName].findFirst({
    where: prismaWhere,
    select,
  });

  if (!row) return null;
  return mapRows([row], ctx, typeName)[0] ?? null;
}
