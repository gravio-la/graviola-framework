import type {
  ChangeListener,
  EntityChangeEvent,
  ReadableImportSource,
  SchemaRegistry,
  Unsubscribe,
} from "@graviola/store-core";

import type { FullTextSearchAdapter } from "../engine";
import {
  getTypeRouting,
  isFulltextType,
  type RoutingPolicy,
} from "../routing/build-routing-policy";

export type FulltextIndexSyncSource<R extends SchemaRegistry> =
  ReadableImportSource<R> & {
    subscribe?: (listener: ChangeListener<R>) => Unsubscribe;
  };

export type SubscribeFulltextIndexSyncOptions<
  R extends SchemaRegistry = SchemaRegistry,
> = {
  routing: RoutingPolicy;
  adapter: FullTextSearchAdapter;
  primary: FulltextIndexSyncSource<R>;
  importOne: (
    typeName: keyof R & string,
    entityIRI: string,
    source: ReadableImportSource<R>,
  ) => Promise<unknown>;
  encodeEntityId: (typeName: string, iri: string) => string;
  /** Soft-fail errors so a Meili blip does not break CRUD. Default: console.warn */
  onError?: (error: unknown, event: EntityChangeEvent<R>) => void;
};

export type FulltextIndexSyncHandle = {
  unsubscribe: Unsubscribe;
  /** Await queued index sync work (for tests). */
  flush: () => Promise<void>;
};

/**
 * Keep searchable FT indexes aligned with primary mutations via the change bus.
 * Mirrors calc's `subscribeCalcInvalidation` substrate.
 */
export function subscribeFulltextIndexSync<
  R extends SchemaRegistry = SchemaRegistry,
>(
  options: SubscribeFulltextIndexSyncOptions<R>,
): FulltextIndexSyncHandle | null {
  const { routing, adapter, primary, importOne, encodeEntityId } = options;
  if (typeof primary.subscribe !== "function") {
    return null;
  }

  const onError =
    options.onError ??
    ((error: unknown, event: EntityChangeEvent<R>) => {
      console.warn(
        `[fulltext-index-sync] ${event.changeType} ${event.typeName} ${event.entityIRI}:`,
        error,
      );
    });

  // Serialize async work so overlapping upserts do not race Meili writes.
  let chain: Promise<void> = Promise.resolve();

  const enqueue = (work: () => Promise<void>) => {
    chain = chain.then(work).catch(() => {
      /* already reported in work */
    });
  };

  const unsubscribe = primary.subscribe((event) => {
    const typeName = event.typeName;
    if (!isFulltextType(routing, typeName)) return;

    enqueue(async () => {
      try {
        if (event.changeType === "upsert") {
          await importOne(typeName, event.entityIRI, primary);
          return;
        }

        const typeRouting = getTypeRouting(routing, typeName);
        if (!typeRouting || typeof adapter.deleteDocuments !== "function") {
          return;
        }
        const docId = encodeEntityId(typeName, event.entityIRI);
        await adapter.deleteDocuments(typeRouting.indexUid, [docId]);
      } catch (error) {
        onError(error, event);
      }
    });
  });

  return {
    unsubscribe,
    flush: () => chain,
  };
}
