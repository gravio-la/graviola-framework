import { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";
import type { PersistenceManifest } from "@graviola/json-schema-prisma-utils";

import { getPropertiesAndConnects } from "./helper";
import type { AbstractPrismaClient } from "./types";

export const save = async <
  TPrisma extends AbstractPrismaClient = AbstractPrismaClient,
>(
  typeNameOrigin: string,
  document: any,
  prisma: TPrisma,
  importError: Set<string>,
  options: {
    allowNonTransactionalFallback?: boolean;
    idToIRI?: StringToIRIFn;
    IRItoId?: IRIToStringFn;
    typeNameToTypeIRI?: StringToIRIFn;
    typeIsNotIRI?: boolean;
    debug?: boolean;
    persistenceManifest?: PersistenceManifest;
  },
) => {
  const { id, properties, connects } = await getPropertiesAndConnects(
    typeNameOrigin,
    document,
    prisma,
    importError,
    "",
    {
      IRItoId: options.IRItoId,
      typeNameToTypeIRI: options.typeNameToTypeIRI,
      typeIsNotIRI: options.typeIsNotIRI,
      debug: options.debug,
      persistenceManifest: options.persistenceManifest,
      rootEntityIRI:
        typeof document["@id"] === "string" ? document["@id"] : undefined,
    },
  );

  if (!id) {
    console.error("no id");
    return;
  }
  const type = options.typeNameToTypeIRI
    ? options.typeNameToTypeIRI(typeNameOrigin)
    : typeNameOrigin;

  /** Nested child-table writes: create-only on create; replace on update. */
  const withNestedReplace = (props: Record<string, any>, forUpdate: boolean) =>
    Object.fromEntries(
      Object.entries(props).map(([key, value]) => {
        if (
          forUpdate &&
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          "create" in value &&
          Array.isArray((value as { create: unknown }).create)
        ) {
          return [
            key,
            { deleteMany: {}, create: (value as { create: unknown }).create },
          ];
        }
        return [key, value];
      }),
    );

  const connectEntries = Object.fromEntries(
    Object.entries(connects).map(([key, connect]) => [
      key,
      {
        connect,
      },
    ]),
  );

  const upsertArgs = {
    where: {
      id,
    },
    create: {
      id,
      type,
      ...withNestedReplace(properties, false),
      ...connectEntries,
    },
    update: {
      ...withNestedReplace(properties, true),
      ...connectEntries,
    },
    include: Object.fromEntries(
      Object.keys(connects).map((key) => [key, true]),
    ),
  };

  const runUpsert = async (db: any) => db[typeNameOrigin].upsert(upsertArgs);
  let needsNonTransactionalFallback = false;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const upsertResult = await runUpsert(tx);

      return {
        upsertResult,
      };
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);
    needsNonTransactionalFallback =
      message.includes("replica set") || message.includes("p2031");
  }

  if (needsNonTransactionalFallback && options.allowNonTransactionalFallback) {
    try {
      const upsertResult = await runUpsert(prisma);
      return { upsertResult };
    } catch (error) {
      if (options.debug) {
        console.error("could not save document", typeNameOrigin, id);
        console.error(JSON.stringify(connects, null, 2));
        console.error(error);
      }
      throw error;
    }
  }

  if (options.debug) {
    console.error("could not save document", typeNameOrigin, id);
    console.error(JSON.stringify(connects, null, 2));
  }

  throw new Error(`could not save document ${typeNameOrigin} ${id}`);
};
