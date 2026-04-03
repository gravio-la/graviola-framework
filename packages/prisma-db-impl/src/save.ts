import { StringToIRIFn } from "@graviola/edb-core-types";
import { PrismaClient } from "@prisma/client";

import { getPropertiesAndConnects } from "./helper";

export const save = async (
  typeNameOrigin: string,
  document: any,
  prisma: PrismaClient,
  importError: Set<string>,
  options: {
    allowNonTransactionalFallback?: boolean;
    idToIRI?: StringToIRIFn;
    typeNameToTypeIRI?: StringToIRIFn;
    typeIsNotIRI?: boolean;
    debug?: boolean;
  },
) => {
  const { id, properties, connects } = await getPropertiesAndConnects(
    typeNameOrigin,
    document,
    prisma,
    importError,
    "",
    options,
  );

  if (!id) {
    console.error("no id");
    return;
  }
  const type = options.typeNameToTypeIRI
    ? options.typeNameToTypeIRI(typeNameOrigin)
    : typeNameOrigin;

  const upsertArgs = {
    where: {
      id,
    },
    create: {
      id,
      type,
      ...properties,
      // Include all connections in the create operation
      ...Object.fromEntries(
        Object.entries(connects).map(([key, connect]) => [
          key,
          {
            connect,
          },
        ]),
      ),
    },
    update: {
      ...properties,
      // Include all connections in the update operation
      ...Object.fromEntries(
        Object.entries(connects).map(([key, connect]) => [
          key,
          {
            connect,
          },
        ]),
      ),
    },
    include: Object.fromEntries(
      Object.keys(connects).map((key) => [key, true]),
    ),
  };

  const runUpsert = async (db: any) => db[typeNameOrigin].upsert(upsertArgs);
  let needsNonTransactionalFallback = false;

  try {
    // Combine upsert and connect operations into a single transaction
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
      // MongoDB without replica-set cannot run transactions; execute the upsert directly.
      const upsertResult = await runUpsert(prisma as any);
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
