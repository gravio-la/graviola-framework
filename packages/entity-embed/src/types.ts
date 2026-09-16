import type { ComponentType } from "react";

import type {
  EntityEmbedView,
  EntityQuerySpec,
  EntityRef,
} from "@graviola/entity-ref-core";

export type EntitySuggestCandidate = {
  entityIRI: string;
  typeName: string;
  typeIRI?: string;
  label: string;
};

export type EntitySuggestOptions = {
  limit?: number;
  typeNames?: string[];
  /** Optional paragraph context for future RAG providers. */
  context?: string;
};

export type EntitySuggestProvider = {
  suggest: (
    query: string,
    options?: EntitySuggestOptions,
  ) => Promise<EntitySuggestCandidate[]>;
};

export type EntityRefViewProps = {
  ref: EntityRef;
  entityIRI?: string;
  typeName?: string;
  typeIRI?: string;
  label?: string;
  view?: EntityEmbedView;
};

export type EntityEmbedRendererProps = EntityRefViewProps;

export type EntityEmbedRegistry = Partial<
  Record<EntityEmbedView, ComponentType<EntityEmbedRendererProps>>
>;

export type EntityQueryViewProps = {
  spec: EntityQuerySpec;
};
