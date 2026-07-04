import type { WalkerOptions } from "@graviola/edb-core-types";
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { DataFactory, Store } from "n3";
import type { JSONSchema7 } from "json-schema";
import {
  documentToTriples,
  type DocumentToTriplesOptions,
} from "./documentToTriples";
import type { StagedChangeSet } from "./types";

const { namedNode } = DataFactory;

export type OverlayEntityStatus = "new" | "augmented" | "existing";

export type OverlayMainStore = {
  loadOne(
    typeName: string,
    iri: string,
  ): Promise<Record<string, unknown> | null>;
  listAll?(
    typeName: string,
    limit?: number,
  ): Promise<Record<string, unknown>[]>;
};

export type CreateOverlayStoreOptions = {
  changeSet: StagedChangeSet;
  mainStore?: OverlayMainStore;
  schema: JSONSchema7;
  typeIRItoTypeName: (typeIRI: string) => string;
  typeNameToTypeIRI: (typeName: string) => string;
  defaultPrefix: string;
  propertyToIRI?: DocumentToTriplesOptions["propertyToIRI"];
  walkerOptions?: Partial<WalkerOptions>;
};

export type OverlayListItem = {
  document: Record<string, unknown>;
  status: OverlayEntityStatus;
};

export type OverlayStore = {
  loadOne(
    typeName: string,
    iri: string,
  ): Promise<Record<string, unknown> | null>;
  statusOf(iri: string): OverlayEntityStatus | undefined;
  list(typeName: string, limit?: number): Promise<OverlayListItem[]>;
};

const hasSubjectQuads = (store: Store, iri: string): boolean =>
  store.getQuads(namedNode(iri), null, null, null).length > 0;

const buildUnionStore = (staged: Store, hydration: Store): Store => {
  const union = new Store();
  for (const quad of staged.getQuads(null, null, null, null)) {
    union.addQuad(quad);
  }
  for (const quad of hydration.getQuads(null, null, null, null)) {
    union.addQuad(quad);
  }
  return union;
};

export const createOverlayStore = (
  options: CreateOverlayStoreOptions,
): OverlayStore => {
  const {
    changeSet,
    mainStore,
    schema,
    typeNameToTypeIRI,
    defaultPrefix,
    propertyToIRI,
    walkerOptions,
  } = options;

  const hydrationStore = new Store();
  const knownMainIRIs = new Set<string>();

  const traverseLoadDocument = (typeName: string, entityIRI: string) => {
    const typeSchema = bringDefinitionToTop(schema, typeName) as JSONSchema7;
    const union = buildUnionStore(changeSet.dataset as Store, hydrationStore);
    return traverseGraphExtractBySchema(
      defaultPrefix,
      entityIRI,
      union,
      typeSchema,
      {
        ...walkerOptions,
        maxRecursion: walkerOptions?.maxRecursion,
      },
    );
  };

  const hydrateFromMain = async (
    typeName: string,
    iri: string,
  ): Promise<boolean> => {
    if (!mainStore) return false;
    const doc = await mainStore.loadOne(typeName, iri);
    if (!doc || typeof doc["@id"] !== "string") return false;
    knownMainIRIs.add(iri);
    for (const quad of documentToTriples(doc, { propertyToIRI })) {
      hydrationStore.addQuad(quad);
    }
    return true;
  };

  const hasLocalQuads = (iri: string): boolean =>
    hasSubjectQuads(changeSet.dataset as Store, iri) ||
    hasSubjectQuads(hydrationStore, iri);

  const statusOf: OverlayStore["statusOf"] = (iri) => {
    const staged = changeSet.get(iri);
    const hasMain =
      hasSubjectQuads(hydrationStore, iri) || knownMainIRIs.has(iri);

    if (staged && hasMain) return "augmented";
    if (staged) return "new";
    if (hasMain) return "existing";
    return undefined;
  };

  const loadOne: OverlayStore["loadOne"] = async (typeName, iri) => {
    if (!hasLocalQuads(iri)) {
      if (!mainStore) return null;
      const hydrated = await hydrateFromMain(typeName, iri);
      if (!hydrated) return null;
    }

    const doc = traverseLoadDocument(typeName, iri);
    return (doc as Record<string, unknown> | null | undefined) ?? null;
  };

  const list: OverlayStore["list"] = async (typeName, limit) => {
    const typeIRI = typeNameToTypeIRI(typeName);
    const byIRI = new Map<string, OverlayListItem>();

    for (const entity of changeSet.list()) {
      if (entity.typeIRI !== typeIRI) continue;
      byIRI.set(entity.entityIRI, {
        document: entity.document,
        status: statusOf(entity.entityIRI) ?? "new",
      });
    }

    if (mainStore?.listAll) {
      const mainDocs = await mainStore.listAll(typeName, limit);
      for (const doc of mainDocs) {
        const iri = doc["@id"];
        if (typeof iri !== "string") continue;
        knownMainIRIs.add(iri);
        if (byIRI.has(iri)) {
          byIRI.set(iri, {
            document: byIRI.get(iri)!.document,
            status: statusOf(iri) ?? "augmented",
          });
        } else {
          byIRI.set(iri, {
            document: doc,
            status: statusOf(iri) ?? "existing",
          });
        }
      }
    }

    const items = [...byIRI.values()];
    return limit !== undefined ? items.slice(0, limit) : items;
  };

  return {
    loadOne,
    statusOf,
    list,
  };
};
