import type { Entity } from "@graviola/edb-core-types";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { SearchFacetSchema } from "@graviola/search-facet-schema";
import type {
  Aggregates,
  BaseStore,
  CapabilityDescriptor,
  EntityOf,
  FacetResult,
  Filters,
  Imports,
  Loads,
  ReadableImportSource,
  SchemaRegistry,
  Searches,
  StoreDocumentsSearchOptions,
  StoreId,
  TextSearchHit,
  TextSearches,
} from "@graviola/store-core";
import type { JSONSchema7 } from "json-schema";

import type {
  FullTextSearchAdapter,
  FacetFilter,
  TextIndexQuery,
} from "./engine";
import {
  hitToJsonLd,
  mergeHydratedStub,
  type JsonLdEntity,
} from "./hit-to-jsonld";
import { defaultIndexIdCodec, type IndexIdCodec } from "./id-mapping";
import { projectEntityToIndexDoc } from "./project-entity";
import {
  buildRoutingPolicy,
  getTypeRouting,
  isFacetProperty,
  isFulltextType,
  propertyNameFromScope,
  resolveIndexField,
  type RoutingPolicy,
} from "./routing/build-routing-policy";
import {
  subscribeFulltextIndexSync,
  type FulltextIndexSyncHandle,
} from "./sync/subscribeFulltextIndexSync";

/** Primary store must support entity hydration at minimum. */
export type PrimaryStore<R extends SchemaRegistry = SchemaRegistry> =
  BaseStore<R> &
    Loads<R> &
    Partial<Searches<R>> &
    Partial<Aggregates<R>> &
    Partial<Filters<R>>;

export type SearchDocumentsOptions = {
  limit?: number;
  offset?: number;
  filters?: FacetFilter[];
  /**
   * When true, merge each hit with the primary document (default false).
   * Prefers one `filterMany({ entityIRIs })` batch; falls back to N× `loadOne`.
   */
  hydrate?: boolean;
  fields?: string[];
};

export type SearchDocumentsResult<T = JsonLdEntity> = {
  documents: T[];
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query: string;
  facetDistribution?: Record<string, Record<string, number>>;
};

export type FulltextSearchStoreConfig<
  R extends SchemaRegistry = SchemaRegistry,
> = {
  storeId?: string;
  adapter: FullTextSearchAdapter;
  primaryStore: PrimaryStore<R>;
  searchFacetSchema: SearchFacetSchema;
  schema: JSONSchema7;
  primaryFields: PrimaryFieldDeclaration;
  scopeToIndexField?: Record<string, string>;
  indexNameForType?: (typeName: string) => string;
  /** Global document id codec (default: base64url full IRI). */
  idCodec?: IndexIdCodec;
  /** Per-type codec override (e.g. legacy hex ids for one index). */
  idCodecForType?: (typeName: string) => IndexIdCodec | undefined;
  /** Type names whose indexes already exist — skip ensureIndex in prepareFulltextIndexes. */
  existingIndexTypes?: string[];
  /**
   * Optional enricher run before projecting an entity into an index document
   * (e.g. merge materialized calc fields). Core stays calc-engine-free —
   * callers / CLI supply the callback.
   */
  enrichEntityForIndex?: (
    typeName: string,
    entity: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
};

export type FulltextSearchStore<R extends SchemaRegistry = SchemaRegistry> =
  PrimaryStore<R> &
    TextSearches &
    Aggregates<R> &
    Searches<R> &
    Filters<R> &
    Imports<R> & {
      readonly routing: RoutingPolicy;
      readonly adapter: FullTextSearchAdapter;
      /** Stop change-bus → index sync (no-op if primary has no subscribe). */
      unsubscribeFulltextIndexSync: () => void;
      /** Await queued index sync (tests). No-op when sync is inactive. */
      flushFulltextIndexSync: () => Promise<void>;
      searchDocuments<T extends JsonLdEntity = JsonLdEntity>(
        typeName: keyof R & string,
        text: string,
        options?: SearchDocumentsOptions,
      ): Promise<SearchDocumentsResult<T>>;
      importAllSearchableTypes(
        source: ReadableImportSource<R> & {
          list?: (
            typeName: string,
            limit?: number,
          ) => Promise<Record<string, unknown>[]>;
        },
        options?: { order?: string[]; limit?: number },
      ): Promise<Record<string, Record<string, unknown>[]>>;
    };

function mergeCapabilities(
  primary: CapabilityDescriptor,
): CapabilityDescriptor {
  return {
    ...primary,
    searches: true,
    textSearches: true,
    aggregates: true,
    imports: true,
    filters: primary.filters ?? true,
    profiles: {
      ...primary.profiles,
      searches: {
        ...primary.profiles?.searches,
        mode: "fulltext",
        ranked: true,
      },
    },
  };
}

/** Preserve Meilisearch hit order when reordering primary `filterMany` results. */
function orderByIris<T>(iris: string[], docs: T[]): T[] {
  const byIri = new Map<string, T>();
  for (const doc of docs) {
    const id = (doc as { "@id"?: unknown })["@id"];
    if (typeof id === "string" && id.length > 0) {
      byIri.set(id, doc);
    }
  }
  return iris
    .map((iri) => byIri.get(iri))
    .filter((d): d is T => d !== undefined);
}

function facetDistributionToResult(
  distribution: Record<string, Record<string, number>> | undefined,
  facetIndexFields: string[],
  propertyFields: string[],
  matched: number,
): FacetResult {
  const facets: FacetResult["facets"] = {};
  for (let i = 0; i < facetIndexFields.length; i++) {
    const indexField = facetIndexFields[i]!;
    const propField = propertyFields[i] ?? indexField;
    const buckets = distribution?.[indexField];
    if (!buckets) {
      facets[propField] = [];
      continue;
    }
    facets[propField] = Object.entries(buckets).map(([value, count]) => ({
      value,
      count,
    }));
  }
  return { matched, facets };
}

type ListCapableSource<R extends SchemaRegistry> = ReadableImportSource<R> & {
  list?: (typeName: string, limit?: number) => Promise<unknown[]>;
};

export function initFulltextSearchStore<R extends SchemaRegistry>(
  rawConfig: FulltextSearchStoreConfig<R>,
): FulltextSearchStore<R> {
  const primary = rawConfig.primaryStore;
  const routing = buildRoutingPolicy({
    sidecar: rawConfig.searchFacetSchema,
    primaryFields: rawConfig.primaryFields,
    scopeToIndexField: rawConfig.scopeToIndexField,
    indexNameForType: rawConfig.indexNameForType,
    adapter: rawConfig.adapter,
  });

  const config: FulltextSearchStoreConfig<R> = {
    ...rawConfig,
  };

  const storeId = (config.storeId ?? `fulltext+${primary.storeId}`) as StoreId;

  const typeIri = (typeName: string) => primary.typeNameToTypeIRI(typeName);

  function resolveIdCodec(typeName: string): IndexIdCodec {
    return (
      config.idCodecForType?.(typeName) ??
      config.idCodec ??
      defaultIndexIdCodec()
    );
  }

  function encodeEntityId(typeName: string, iri: string): string {
    const id = resolveIdCodec(typeName).encodeIriToDocId(iri);
    return config.adapter.sanitizeId?.(id) ?? id;
  }

  async function prepareEntityForIndex(
    typeName: string,
    entity: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!config.enrichEntityForIndex) return entity;
    return config.enrichEntityForIndex(typeName, entity);
  }

  async function runIndexSearch(
    typeName: string,
    query: TextIndexQuery,
  ): Promise<Awaited<ReturnType<FullTextSearchAdapter["search"]>>> {
    const typeRouting = getTypeRouting(routing, typeName);
    if (!typeRouting?.searchable) {
      throw new Error(`Type "${typeName}" is not full-text searchable`);
    }
    return config.adapter.search(typeRouting.indexUid, query);
  }

  async function hydrateDocuments<T extends JsonLdEntity>(
    typeName: keyof R & string,
    stubs: T[],
  ): Promise<T[]> {
    if (stubs.length === 0) return stubs;

    const iris = stubs
      .map((s) => s["@id"])
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (typeof primary.filterMany === "function" && iris.length > 0) {
      try {
        const loaded = (await primary.filterMany(typeName, {
          entityIRIs: iris,
          limit: iris.length,
        })) as JsonLdEntity[];
        const byIri = new Map(
          loaded.map((doc) => [
            String(doc["@id"]),
            doc as Record<string, unknown>,
          ]),
        );
        return stubs.map((stub) =>
          mergeHydratedStub(stub, byIri.get(stub["@id"]) ?? null),
        );
      } catch {
        // fall through to loadOne
      }
    }

    if (!primary.loadOne) return stubs;

    const results: T[] = [];
    for (const stub of stubs) {
      try {
        const hydrated = await primary.loadOne(typeName, stub["@id"]);
        results.push(
          mergeHydratedStub(stub, hydrated as Record<string, unknown> | null),
        );
      } catch {
        results.push(stub);
      }
    }
    return results;
  }

  const storeOverrides = {
    storeId,
    capabilities: mergeCapabilities(primary.capabilities),
    routing,
    adapter: config.adapter,

    async searchDocuments<T extends JsonLdEntity = JsonLdEntity>(
      typeName: keyof R & string,
      text: string,
      options: SearchDocumentsOptions = {},
    ): Promise<SearchDocumentsResult<T>> {
      const typeRouting = getTypeRouting(routing, typeName);
      if (!typeRouting?.searchable) {
        throw new Error(
          `Type "${typeName}" is not full-text searchable (use primary store search)`,
        );
      }

      const limit = options.limit ?? 20;
      const offset = Math.max(0, options.offset ?? 0);

      let attributesToSearchOn: string[] | undefined;
      if (options.fields?.length) {
        attributesToSearchOn = options.fields
          .map((f) => resolveIndexField(routing, typeName, f))
          .filter((f): f is string => Boolean(f));
        if (attributesToSearchOn.length === 0) {
          throw new Error(
            `None of the requested search fields are declared in the search facet sidecar: ${options.fields.join(", ")}`,
          );
        }
      } else if (typeRouting.fulltextIndexFields.length > 0) {
        attributesToSearchOn = typeRouting.fulltextIndexFields;
      }

      const response = await runIndexSearch(typeName, {
        q: text,
        limit,
        offset,
        attributesToSearchOn,
        filters: options.filters,
      });

      let documents = response.hits.map((hit) =>
        hitToJsonLd(hit, typeRouting, {
          typeIri: typeIri(typeName),
          decodeId: resolveIdCodec(typeName).decodeDocIdToIri,
        }),
      ) as T[];

      if (options.hydrate) {
        documents = await hydrateDocuments(typeName, documents);
      }

      return {
        documents,
        estimatedTotalHits: response.estimatedTotalHits,
        processingTimeMs: response.processingTimeMs,
        query: text,
        facetDistribution: response.facetDistribution,
      };
    },

    async searchText(
      typeName: string,
      text: string,
      options: { limit?: number; offset?: number; fields?: string[] } = {},
    ): Promise<TextSearchHit[]> {
      const limit = options.limit ?? 20;

      if (!isFulltextType(routing, typeName)) {
        if (typeof primary.findEntityByTypeName === "function") {
          const entities = await primary.findEntityByTypeName(
            typeName,
            text,
            limit,
          );
          return entities.map(
            (e, index): TextSearchHit => ({
              iri: e.entityIRI,
              score: 1 - index / Math.max(entities.length, 1),
            }),
          );
        }
        throw new Error(
          `Type "${typeName}" is not full-text searchable and primary store has no findEntityByTypeName`,
        );
      }

      const result = await storeOverrides.searchDocuments(
        typeName as keyof R & string,
        text,
        {
          limit,
          offset: options.offset,
          fields: options.fields,
        },
      );

      return result.documents.map(
        (doc, index): TextSearchHit => ({
          iri: doc["@id"],
          score: 1 - index / Math.max(result.documents.length, 1),
        }),
      );
    },

    async searchByLabel<T extends keyof R & string>(
      typeName: T,
      label: string,
      limit = 20,
    ) {
      if (!isFulltextType(routing, typeName)) {
        if (typeof primary.searchByLabel === "function") {
          return primary.searchByLabel(typeName, label, limit);
        }
        throw new Error(
          `Type "${typeName}" is not full-text searchable and primary store has no searchByLabel`,
        );
      }

      const result = await storeOverrides.searchDocuments(typeName, label, {
        limit,
        hydrate: true,
      });
      return result.documents as R[T][];
    },

    async findEntityByTypeName(
      typeName: string,
      searchString: string,
      limit = 20,
    ): Promise<Entity[]> {
      if (!isFulltextType(routing, typeName)) {
        if (typeof primary.findEntityByTypeName === "function") {
          return primary.findEntityByTypeName(typeName, searchString, limit);
        }
        throw new Error(
          `Type "${typeName}" is not full-text searchable and primary store has no findEntityByTypeName`,
        );
      }

      const result = await storeOverrides.searchDocuments(
        typeName as keyof R & string,
        searchString,
        { limit },
      );

      return result.documents.map(
        (doc): Entity => ({
          entityIRI: doc["@id"],
          typeIRI: String(doc["@type"]),
          value: String(doc.label ?? doc.name ?? doc.title ?? doc["@id"]),
          label:
            typeof doc.label === "string"
              ? doc.label
              : typeof doc.name === "string"
                ? doc.name
                : undefined,
        }),
      );
    },

    async filterMany<T extends keyof R & string>(
      typeName: T,
      options?: StoreDocumentsSearchOptions<EntityOf<R, T>>,
    ): Promise<EntityOf<R, T>[]> {
      const searchString = options?.searchString;
      if (
        typeof searchString === "string" &&
        searchString.length > 0 &&
        isFulltextType(routing, typeName)
      ) {
        const limit = options?.limit ?? 20;
        const result = await storeOverrides.searchDocuments(
          typeName,
          searchString,
          {
            limit,
            hydrate: false,
          },
        );
        const iris = result.documents
          .map((d) => d["@id"])
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          );
        if (iris.length === 0) return [];

        if (typeof primary.filterMany === "function") {
          const { searchString: _ignored, ...rest } = options ?? {};
          const loaded = await primary.filterMany(typeName, {
            ...rest,
            entityIRIs: iris,
            limit: iris.length,
          });
          return orderByIris(iris, loaded as EntityOf<R, T>[]);
        }

        const hydrated = await hydrateDocuments(
          typeName,
          result.documents as JsonLdEntity[],
        );
        return hydrated as EntityOf<R, T>[];
      }

      if (typeof primary.filterMany === "function") {
        return primary.filterMany(typeName, options);
      }
      throw new Error(
        `filterMany is not available on primary store "${String(primary.storeId)}"`,
      );
    },

    async filterOne<T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      options?: Parameters<Filters<R>["filterOne"]>[2],
    ): Promise<EntityOf<R, T> | null> {
      if (typeof primary.filterOne === "function") {
        return primary.filterOne(
          typeName,
          entityIRI,
          options,
        ) as Promise<EntityOf<R, T> | null>;
      }
      if (typeof primary.filterMany === "function") {
        const rows = await primary.filterMany(typeName, {
          ...options,
          entityIRIs: [entityIRI],
          limit: 1,
        });
        return (rows[0] as EntityOf<R, T> | undefined) ?? null;
      }
      if (typeof primary.loadOne === "function") {
        return (await primary.loadOne(typeName, entityIRI)) as EntityOf<
          R,
          T
        > | null;
      }
      throw new Error(
        `filterOne is not available on primary store "${String(primary.storeId)}"`,
      );
    },

    async facet<T extends keyof R & string>(
      typeName: T,
      options: { facets: string[] },
    ) {
      const typeRouting = getTypeRouting(routing, typeName);
      if (!typeRouting) {
        throw new Error(`Unknown type "${typeName}" in routing policy`);
      }

      const facetIndexFields: string[] = [];
      const propertyFields: string[] = [];
      const rejected: string[] = [];

      for (const f of options.facets) {
        const prop = f.startsWith("#/") ? propertyNameFromScope(f) : f;
        if (!prop || !isFacetProperty(routing, typeName, prop)) {
          rejected.push(f);
          continue;
        }
        const indexField = resolveIndexField(routing, typeName, f);
        if (indexField) {
          facetIndexFields.push(indexField);
          propertyFields.push(prop);
        } else {
          rejected.push(f);
        }
      }

      if (facetIndexFields.length === 0) {
        if (typeof primary.facet === "function") {
          return primary.facet(typeName, options);
        }
        throw new Error(
          `No facet-enabled fields in sidecar for: ${options.facets.join(", ")}${rejected.length ? ` (not routable: ${rejected.join(", ")})` : ""}`,
        );
      }

      if (!typeRouting.searchable && typeof primary.facet === "function") {
        return primary.facet(typeName, options);
      }

      const response = await runIndexSearch(typeName, {
        q: "",
        limit: 0,
        facets: facetIndexFields,
      });

      const matched =
        response.estimatedTotalHits ??
        Object.values(response.facetDistribution ?? {})[0]?.length ??
        0;

      return facetDistributionToResult(
        response.facetDistribution,
        facetIndexFields,
        propertyFields,
        matched,
      );
    },

    async importOne<T extends keyof R & string>(
      typeName: T,
      entityIRI: string,
      source: ReadableImportSource<R>,
    ) {
      const typeRouting = getTypeRouting(routing, typeName);
      if (!typeRouting?.searchable) {
        throw new Error(
          `Type "${typeName}" is not full-text searchable — cannot import to FT index`,
        );
      }

      const entity = await source.loadOne(typeName, entityIRI);
      if (!entity) {
        throw new Error(`Entity not found: ${entityIRI}`);
      }

      const enriched = await prepareEntityForIndex(
        typeName,
        entity as Record<string, unknown>,
      );

      const doc = projectEntityToIndexDoc(enriched, typeRouting, {
        typeIri: typeIri(typeName),
        primaryFields: config.primaryFields,
        encodeId: (iri) => encodeEntityId(typeName, iri),
      });

      await config.adapter.addDocuments(typeRouting.indexUid, [doc]);
      return entity;
    },

    async importMany<T extends keyof R & string>(
      typeName: T,
      source: ListCapableSource<R>,
      limit: number,
    ) {
      const typeRouting = getTypeRouting(routing, typeName);
      if (!typeRouting?.searchable) {
        throw new Error(
          `Type "${typeName}" is not full-text searchable — cannot import to FT index`,
        );
      }

      if (typeof source.list !== "function") {
        throw new Error(
          "importMany requires source.list — primary store must implement Lists",
        );
      }

      const entities = (await source.list(typeName, limit)) as Record<
        string,
        unknown
      >[];

      const docs: ReturnType<typeof projectEntityToIndexDoc>[] = [];
      for (const entity of entities) {
        const enriched = await prepareEntityForIndex(typeName, entity);
        docs.push(
          projectEntityToIndexDoc(enriched, typeRouting, {
            typeIri: typeIri(typeName),
            primaryFields: config.primaryFields,
            encodeId: (iri) => encodeEntityId(typeName, iri),
          }),
        );
      }

      if (docs.length > 0) {
        await config.adapter.addDocuments(typeRouting.indexUid, docs);
      }

      return entities as R[T][];
    },

    async importAllSearchableTypes(
      source: ListCapableSource<R>,
      options: { order?: string[]; limit?: number } = {},
    ) {
      const limit = options.limit ?? 10_000;
      const order =
        options.order ??
        [...routing.types.values()]
          .filter((t) => t.searchable)
          .map((t) => t.typeName);

      const result: Record<string, Record<string, unknown>[]> = {};
      for (const typeName of order) {
        if (!isFulltextType(routing, typeName)) continue;
        result[typeName] = (await storeOverrides.importMany(
          typeName as keyof R & string,
          source,
          limit,
        )) as Record<string, unknown>[];
      }
      return result;
    },
  };

  const store = {
    ...primary,
    ...storeOverrides,
  } as FulltextSearchStore<R>;

  const syncHandle: FulltextIndexSyncHandle | null = subscribeFulltextIndexSync(
    {
      routing,
      adapter: config.adapter,
      primary,
      importOne: (typeName, entityIRI, source) =>
        store.importOne(typeName, entityIRI, source),
      encodeEntityId,
    },
  );

  store.unsubscribeFulltextIndexSync = () => {
    syncHandle?.unsubscribe();
  };
  store.flushFulltextIndexSync = async () => {
    await syncHandle?.flush();
  };

  return store;
}

/** Type guard for composite full-text search stores. */
export function isFulltextSearchStore(
  store: BaseStore<SchemaRegistry> | null | undefined,
): store is FulltextSearchStore {
  return Boolean(
    store &&
    store.capabilities.textSearches &&
    "routing" in store &&
    "searchDocuments" in store &&
    "adapter" in store,
  );
}
