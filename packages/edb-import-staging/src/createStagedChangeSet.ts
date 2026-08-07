import { Store } from "n3";
import type { DatasetCore } from "@rdfjs/types";
import {
  documentToTriples,
  removeSubjectQuads,
  type DocumentToTriplesOptions,
} from "./documentToTriples";
import { referenceFirstApplyOrder } from "./applyOrder";
import { prepareStagedDocument } from "./prepareStagedDocument";
import type { ChangeSetEvent, StagedChangeSet, StagedEntity } from "./types";

export type CreateStagedChangeSetOptions = {
  changeSetIRI?: string;
  propertyToIRI?: DocumentToTriplesOptions["propertyToIRI"];
};

let changeSetCounter = 0;

const defaultChangeSetIRI = (): string => {
  changeSetCounter += 1;
  return `urn:graviola:changeset:${changeSetCounter}`;
};

const mergeDocuments = (
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> => ({
  ...existing,
  ...incoming,
});

const computeDepth = (
  parentIRI: string | undefined,
  entities: Map<string, StagedEntity>,
  explicitDepth?: number,
): number => {
  if (explicitDepth !== undefined) return explicitDepth;
  if (!parentIRI) return 0;
  const parent = entities.get(parentIRI);
  return parent ? parent.depth + 1 : 0;
};

export const createStagedChangeSet = (
  options: CreateStagedChangeSetOptions = {},
): StagedChangeSet => {
  const changeSetIRI = options.changeSetIRI ?? defaultChangeSetIRI();
  const propertyToIRI = options.propertyToIRI;
  const store = new Store();
  const entities = new Map<string, StagedEntity>();
  const insertionOrder: string[] = [];
  const listeners = new Set<(event: ChangeSetEvent) => void>();

  const emit = (event: ChangeSetEvent) => {
    for (const listener of listeners) {
      listener(event);
    }
  };

  const recomputeDepthSubtree = (entityIRI: string): void => {
    const entity = entities.get(entityIRI);
    if (!entity) return;
    const parent = entity.parentIRI
      ? entities.get(entity.parentIRI)
      : undefined;
    entity.depth = parent ? parent.depth + 1 : 0;
    for (const child of insertionOrder
      .map((iri) => entities.get(iri)!)
      .filter((e) => e.parentIRI === entityIRI)) {
      recomputeDepthSubtree(child.entityIRI);
    }
  };

  const reparent: StagedChangeSet["reparent"] = (entityIRI, newParentIRI) => {
    const entity = entities.get(entityIRI);
    if (!entity) {
      throw new Error(`Unknown staged entity: ${entityIRI}`);
    }
    const newParent = entities.get(newParentIRI);
    if (!newParent) {
      throw new Error(`Unknown staged parent: ${newParentIRI}`);
    }
    if (entityIRI === newParentIRI) {
      throw new Error("Cannot reparent entity to itself");
    }

    entity.parentIRI = newParentIRI;
    recomputeDepthSubtree(entityIRI);
    emit({ kind: "updated", entity });
  };

  const stage: StagedChangeSet["stage"] = async (input) => {
    const existing = entities.get(input.entityIRI);
    const parentIRI = input.parentIRI;
    const depth = computeDepth(parentIRI, entities, input.depth);
    const mergedDocument = existing
      ? mergeDocuments(existing.document, input.document)
      : { ...input.document };

    const staged: StagedEntity = {
      entityIRI: input.entityIRI,
      typeIRI: input.typeIRI,
      document: mergedDocument,
      provenance: input.provenance,
      trace: input.trace,
      parentIRI,
      depth,
      reviewState: existing?.reviewState ?? "pending",
    };

    removeSubjectQuads(store, input.entityIRI);
    for (const q of documentToTriples(mergedDocument, { propertyToIRI })) {
      store.addQuad(q);
    }

    if (existing) {
      entities.set(input.entityIRI, staged);
      emit({ kind: "updated", entity: staged });
    } else {
      entities.set(input.entityIRI, staged);
      insertionOrder.push(input.entityIRI);
      emit({ kind: "staged", entity: staged });
    }

    return staged;
  };

  return {
    changeSetIRI,

    stage,
    reparent,
    get: (entityIRI) => entities.get(entityIRI),
    list: () => insertionOrder.map((iri) => entities.get(iri)!),
    roots: () =>
      insertionOrder
        .map((iri) => entities.get(iri)!)
        .filter((entity) => entity.parentIRI === undefined),
    childrenOf: (entityIRI) =>
      insertionOrder
        .map((iri) => entities.get(iri)!)
        .filter((entity) => entity.parentIRI === entityIRI),

    setReviewState: (entityIRI, state) => {
      const entity = entities.get(entityIRI);
      if (!entity) {
        throw new Error(`Unknown staged entity: ${entityIRI}`);
      }
      entity.reviewState = state;
      emit({ kind: "review-changed", entityIRI, reviewState: state });
    },

    applyAll: async (target, typeIRItoTypeName) => {
      const toApply = referenceFirstApplyOrder(
        insertionOrder
          .map((iri) => entities.get(iri)!)
          .filter((entity) => entity.reviewState !== "rejected"),
      );
      const appliedIRIs: string[] = [];
      const total = toApply.length;

      for (let index = 0; index < toApply.length; index += 1) {
        const entity = toApply[index]!;
        const typeName = typeIRItoTypeName(entity.typeIRI);
        const document = prepareStagedDocument(entity.document);
        await target.upsert(typeName, entity.entityIRI, document);
        appliedIRIs.push(entity.entityIRI);
        emit({
          kind: "apply-progress",
          done: index + 1,
          total,
          currentIRI: entity.entityIRI,
        });
      }

      emit({ kind: "applied", appliedIRIs });
      return appliedIRIs;
    },

    discard: () => {
      for (const quad of store.getQuads(null, null, null, null)) {
        store.removeQuad(quad);
      }
      entities.clear();
      insertionOrder.length = 0;
      emit({ kind: "discarded" });
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    get dataset(): DatasetCore {
      return store;
    },
  };
};
