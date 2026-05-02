import React from "react";
import type { Decorator } from "@storybook/react";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  EntityDetailModal,
  EditEntityModal,
  KBMainDatabase,
} from "@graviola/edb-advanced-components";
import { EntityFinder } from "@graviola/entity-finder";
import { Provider } from "react-redux";
import {
  SemanticJsonFormNoOps,
  createSemanticConfig,
} from "@graviola/semantic-json-form";
import type {
  EntityFinderProps,
  FinderKnowledgeBaseDescription,
  ModRouter,
} from "@graviola/semantic-jsonform-types";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";

import { withLocalOxigraph } from "./withLocalOxigraph";

const BASE_IRI = "http://ontologies.slub-dresden.de/exhibition#";
const PUBLIC_BASE_PATH =
  (import.meta as any).env?.STORYBOOK_BASE_PATH ||
  (import.meta as any).env?.VITE_BASE_PATH ||
  "";

const SimilarityFinder = (props: EntityFinderProps) => {
  const { queryBuildOptions } = useAdbContext();
  const { dataStore } = useDataStore();
  const allKnowledgeBases = React.useMemo<
    FinderKnowledgeBaseDescription<any>[]
  >(
    () =>
      dataStore
        ? [
            KBMainDatabase(
              dataStore,
              queryBuildOptions.primaryFields,
              queryBuildOptions.typeIRItoTypeName,
            ),
          ]
        : [],
    [
      dataStore,
      queryBuildOptions.primaryFields,
      queryBuildOptions.typeIRItoTypeName,
    ],
  );
  return <EntityFinder {...props} allKnowledgeBases={allKnowledgeBases} />;
};

export const useRouterMock = (): ModRouter => {
  return {
    push: async (url: any) => {
      console.log("push", url);
    },
    replace: async (url: any) => {
      console.log("replace", url);
    },
    asPath: "",
    pathname: "",
    query: {},
    searchParams: new URLSearchParams(),
  };
};

/**
 * Wraps the story in the full Graviola application context: Redux store,
 * AdbProvider with router/component overrides, and a Local Oxigraph store
 * pre-loaded with example RDF data.
 *
 * Use this for stories that exercise components needing useAdbContext,
 * useExtendedSchema, or the full semantic CRUD pipeline (EntityFinder,
 * SemanticJsonFormNoOps, DiscoverSearchTable, etc.).
 *
 * For stories that only need the in-browser SPARQL store but no AdbContext,
 * prefer withLocalOxigraph alone.
 */
export const withGraviolaProvider: Decorator = (Story, context) => {
  const config = createSemanticConfig({ baseIRI: BASE_IRI });

  return (
    <Provider store={store}>
      <AdbProvider
        {...config}
        schema={{}}
        env={{
          publicBasePath: PUBLIC_BASE_PATH,
          baseIRI: BASE_IRI,
        }}
        components={{
          EntityDetailModal: EntityDetailModal,
          EditEntityModal: EditEntityModal,
          SemanticJsonForm: SemanticJsonFormNoOps,
          SimilarityFinder: SimilarityFinder,
        }}
        useRouterHook={useRouterMock}
      >
        {withLocalOxigraph(Story, context)}
      </AdbProvider>
    </Provider>
  );
};
