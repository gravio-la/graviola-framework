import {
  defaultTypeIRItoTypeName,
  defaultTypeNameToTypeIRI,
  inferPrismaProvider,
  resolveDefaultPrefix,
  typeNamesFromSchema,
} from "./helpers.js";
import type {
  CreateStoreFromSpecOptions,
  CreateStoreResult,
  PrismaBackendSpec,
} from "./types.js";

type PrismaLikeClient = Record<string, unknown> & {
  $disconnect?: () => Promise<void>;
};

async function resolvePrismaClient(
  backend: PrismaBackendSpec,
): Promise<{ client: PrismaLikeClient; dispose?: () => Promise<void> }> {
  if (backend.prisma) {
    const client = backend.prisma as PrismaLikeClient;
    const disconnect = client.$disconnect;
    const dispose =
      typeof disconnect === "function"
        ? () => disconnect.call(client)
        : undefined;
    return { client, dispose };
  }

  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({
    datasources: { db: { url: backend.datasourceUrl } },
  }) as unknown as PrismaLikeClient;
  return {
    client,
    dispose: () =>
      (client.$disconnect?.() ?? Promise.resolve()).catch(() => undefined),
  };
}

export async function createPrismaStore(
  opts: CreateStoreFromSpecOptions & { backend: PrismaBackendSpec },
): Promise<CreateStoreResult> {
  const { initPrismaStore } = await import("@graviola/prisma-db-impl");

  const defaultPrefix = resolveDefaultPrefix(opts.schema, opts.defaultPrefix);
  const typeNameToTypeIRI =
    opts.typeNameToTypeIRI ?? defaultTypeNameToTypeIRI(defaultPrefix);
  const typeIRItoTypeName =
    opts.typeIRItoTypeName ?? defaultTypeIRItoTypeName(defaultPrefix);
  const provider = inferPrismaProvider(
    opts.backend.datasourceUrl,
    opts.backend.provider,
  );

  const { client, dispose } = await resolvePrismaClient(opts.backend);

  const store = initPrismaStore(
    client as never,
    opts.schema,
    opts.primaryFields ?? {},
    {
      jsonldContext: opts.jsonldContext ?? { "@vocab": defaultPrefix },
      defaultPrefix,
      typeNameToTypeIRI,
      typeIRItoTypeName,
      datasourceProvider: provider,
      persistenceManifest: opts.backend.persistenceManifest as never,
    },
  );

  return {
    store: store as unknown as CreateStoreResult["store"],
    typeNames: typeNamesFromSchema(opts.schema),
    dispose,
  };
}
