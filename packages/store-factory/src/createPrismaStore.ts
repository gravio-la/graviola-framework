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

async function resolvePrismaClient(
  backend: PrismaBackendSpec,
): Promise<{ client: Record<string, unknown>; dispose?: () => Promise<void> }> {
  if (backend.prisma) {
    const client = backend.prisma;
    const dispose =
      typeof client.$disconnect === "function"
        ? () => client.$disconnect() as Promise<void>
        : undefined;
    return { client, dispose };
  }

  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({
    datasources: { db: { url: backend.datasourceUrl } },
  }) as unknown as Record<string, unknown>;
  return {
    client,
    dispose: () =>
      (client.$disconnect as () => Promise<void>)().catch(() => undefined),
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
    store: store as CreateStoreResult["store"],
    typeNames: typeNamesFromSchema(opts.schema),
    dispose,
  };
}
