import type {
  BaseStore,
  CapabilityDescriptor,
  EntityOf,
  Identifies,
  ReadResult,
  SchemaRegistry,
  StoreDocumentsSearchOptions,
  StoreId,
  StoreListQuery,
} from "@graviola/store-core";

export type InMemoryEntity = Record<string, unknown> & {
  "@id": string;
  "@type"?: string;
  name?: string;
  label?: string;
};

export type InMemoryStoreOptions<R extends SchemaRegistry> = {
  storeId?: StoreId;
  identifies: Identifies;
  typeNames: (keyof R & string)[];
  capabilities?: Partial<
    Omit<CapabilityDescriptor, "identifies" | "profiles">
  > & {
    profiles?: CapabilityDescriptor["profiles"];
  };
};

const defaultCapabilities: CapabilityDescriptor = {
  identifies: true,
  loads: true,
  lists: true,
  filters: true,
  writes: true,
  removes: true,
  counts: true,
  searches: true,
  exists: true,
  resolves: true,
  profiles: {
    searches: { mode: "substring", ranked: false },
  },
};

const docKey = (typeName: string, entityIRI: string): string =>
  `${typeName}::${entityIRI}`;

const labelOf = (doc: InMemoryEntity): string =>
  (typeof doc.label === "string" ? doc.label : undefined) ??
  (typeof doc.name === "string" ? doc.name : "") ??
  "";

const matchesSearch = (
  doc: InMemoryEntity,
  search: string,
  insensitive = true,
): boolean => {
  const hay = labelOf(doc);
  if (!hay) return false;
  return insensitive
    ? hay.toLowerCase().includes(search.toLowerCase())
    : hay.includes(search);
};

const compareDocs = (
  a: InMemoryEntity,
  b: InMemoryEntity,
  sorting: { id: string; desc?: boolean }[],
): number => {
  for (const s of sorting) {
    const av = a[s.id];
    const bv = b[s.id];
    const aStr = av == null ? "" : String(av);
    const bStr = bv == null ? "" : String(bv);
    const cmp = aStr.localeCompare(bStr);
    if (cmp !== 0) return s.desc ? -cmp : cmp;
  }
  return 0;
};

const matchesWhere = (
  doc: InMemoryEntity,
  where: Record<string, unknown> | undefined,
): boolean => {
  if (!where) return true;
  for (const [key, expected] of Object.entries(where)) {
    if (key === "@id") {
      if (doc["@id"] !== expected) return false;
      continue;
    }
    if (doc[key] !== expected) return false;
  }
  return true;
};

/** Minimal in-memory Store for contract tests and local prototyping. */
export const createInMemoryStore = <R extends SchemaRegistry>(
  opts: InMemoryStoreOptions<R>,
): BaseStore<R> &
  Record<string, unknown> & {
    /** Direct access for assertions */
    readonly documents: Map<string, InMemoryEntity>;
  } => {
  const documents = new Map<string, InMemoryEntity>();
  const capabilities: CapabilityDescriptor = {
    identifies: true,
    profiles: opts.capabilities?.profiles ?? defaultCapabilities.profiles,
    ...(opts.capabilities ?? defaultCapabilities),
  };

  const storeId = (opts.storeId ?? `mem_${crypto.randomUUID()}`) as StoreId;

  const listDocs = (
    typeName: string,
    query?: StoreListQuery,
    limit?: number,
  ): InMemoryEntity[] => {
    let rows = [...documents.values()].filter((d) =>
      docKey(typeName, d["@id"]).startsWith(`${typeName}::`),
    );
    if (query?.search) {
      rows = rows.filter((d) =>
        matchesSearch(d, query.search!, query.insensitive !== false),
      );
    }
    if (query?.sorting?.length) {
      rows.sort((a, b) => compareDocs(a, b, query.sorting!));
    }
    const pageSize = query?.pagination?.pageSize ?? limit ?? rows.length;
    const pageIndex = query?.pagination?.pageIndex ?? 0;
    const offset = pageIndex * pageSize;
    return rows.slice(offset, offset + pageSize);
  };

  const store = {
    storeId,
    capabilities,
    documents,
    typeNameToTypeIRI: opts.identifies.typeNameToTypeIRI,
    typeIRItoTypeName: opts.identifies.typeIRItoTypeName,
    loadOne: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      options?: { withMeta?: boolean },
    ): Promise<EntityOf<R, T> | ReadResult<EntityOf<R, T>> | null> => {
      if (!capabilities.loads) return null;
      const doc = documents.get(docKey(typeName, entityIRI));
      if (!doc) return null;
      if (options?.withMeta) {
        return {
          data: doc as EntityOf<R, T>,
          provenance: {
            sources: [storeId],
            fetchedAt: new Date().toISOString(),
            freshness: "fresh",
          },
        };
      }
      return doc as EntityOf<R, T>;
    },
    exists: async (typeName: string, entityIRI: string): Promise<boolean> => {
      if (!capabilities.exists) return false;
      return documents.has(docKey(typeName, entityIRI));
    },
    upsert: async <T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      document: EntityOf<R, T>,
    ): Promise<EntityOf<R, T>> => {
      const doc = {
        ...(document as InMemoryEntity),
        "@id": entityIRI,
        "@type":
          (document as InMemoryEntity)["@type"] ??
          opts.identifies.typeNameToTypeIRI(typeName),
      };
      documents.set(docKey(typeName, entityIRI), doc);
      return doc as EntityOf<R, T>;
    },
    remove: async (typeName: string, entityIRI: string): Promise<unknown> => {
      documents.delete(docKey(typeName, entityIRI));
      return { ok: true };
    },
    list: async <T extends keyof R & string>(
      typeName: T,
      limit?: number,
      query?: StoreListQuery,
    ): Promise<EntityOf<R, T>[]> => {
      return listDocs(typeName, query, limit) as EntityOf<R, T>[];
    },
    filterMany: async <T extends keyof R & string>(
      typeName: T,
      options?: StoreDocumentsSearchOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T>[]> => {
      let rows = [...documents.values()].filter((d) =>
        docKey(typeName, d["@id"]).startsWith(`${typeName}::`),
      );
      rows = rows.filter((d) =>
        matchesWhere(d, options?.where as Record<string, unknown> | undefined),
      );
      if (options?.searchString) {
        rows = rows.filter((d) => matchesSearch(d, options.searchString!));
      }
      if (options?.limit != null) {
        rows = rows.slice(0, options.limit);
      }
      return rows as EntityOf<R, T>[];
    },
    count: async (
      typeName: string,
      query?: Pick<StoreListQuery, "search" | "insensitive">,
    ): Promise<number> => {
      let rows = [...documents.values()].filter((d) =>
        docKey(typeName, d["@id"]).startsWith(`${typeName}::`),
      );
      if (query?.search) {
        rows = rows.filter((d) =>
          matchesSearch(d, query.search!, query.insensitive !== false),
        );
      }
      return rows.length;
    },
    searchByLabel: async <T extends keyof R & string>(
      typeName: T,
      label: string,
      limit?: number,
    ): Promise<EntityOf<R, T>[]> => {
      let rows = [...documents.values()].filter(
        (d) =>
          docKey(typeName, d["@id"]).startsWith(`${typeName}::`) &&
          matchesSearch(d, label),
      );
      if (limit != null) rows = rows.slice(0, limit);
      return rows as EntityOf<R, T>[];
    },
    findEntityByTypeName: async (
      typeName: string,
      searchString: string,
      limit?: number,
    ) => {
      const rows = await store.searchByLabel(typeName, searchString, limit);
      return rows.map((doc) => {
        const d = doc as InMemoryEntity;
        return {
          entityIRI: d["@id"],
          typeIRI:
            typeof d["@type"] === "string"
              ? d["@type"]
              : opts.identifies.typeNameToTypeIRI(typeName),
          value: d["@id"],
          label: labelOf(d),
          name: typeof d.name === "string" ? d.name : labelOf(d),
        };
      });
    },
    resolveTypes: async (entityIRI: string): Promise<string[]> => {
      for (const doc of documents.values()) {
        if (doc["@id"] === entityIRI) {
          const t = doc["@type"];
          return typeof t === "string" ? [t] : [];
        }
      }
      return [];
    },
  };

  return store;
};

const readOnlyCapabilities: CapabilityDescriptor = {
  identifies: true,
  loads: true,
  lists: true,
  filters: true,
  removes: true,
  counts: true,
  searches: true,
  exists: true,
  resolves: true,
  profiles: defaultCapabilities.profiles,
};

/** Read-only store variant without writes (for capability_not_supported tests). */
export const createReadOnlyInMemoryStore = <R extends SchemaRegistry>(
  opts: InMemoryStoreOptions<R>,
): ReturnType<typeof createInMemoryStore<R>> =>
  createInMemoryStore({
    ...opts,
    capabilities: readOnlyCapabilities,
  });
