"use client";

import React, { useCallback, useMemo } from "react";
import {
  AdbProvider,
  store,
  useAdbContext,
  useDataStore,
} from "@graviola/edb-state-hooks";
import {
  PrimaryFieldDeclaration,
  SparqlEndpoint,
} from "@graviola/edb-core-types";
import NiceModal from "@ebay/nice-modal-react";
import { SparqlStoreProvider } from "@graviola/sparql-store-provider";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
import { Provider } from "react-redux";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  EditEntityModal,
  EntityDetailModal,
  KBMainDatabase,
} from "@graviola/edb-advanced-components";
import { EntityFinder } from "@graviola/entity-finder";
import {
  createSemanticConfig,
  SemanticJsonFormNoOps,
  createUISchemata,
  createStubSchema,
} from "@graviola/semantic-json-form";
import {
  EntityFinderProps,
  FinderKnowledgeBaseDescription,
  GlobalSemanticConfig,
  ModRouter,
} from "@graviola/semantic-jsonform-types";
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  UISchemaElement,
} from "@jsonforms/core";
import { JSONSchema7 } from "json-schema";
import { allRenderers } from "./config";
import { CircularProgress } from "@mui/material";
import { exampleDataTurtle } from "../fixture";

type GraviolaProviderProps = {
  baseIRI: string;
  entityBaseIRI: string;
  children: React.ReactNode;
  schema: JSONSchema7;
  renderers?: JsonFormsRendererRegistryEntry[];
  cellRendererRegistry?: JsonFormsCellRendererRegistryEntry[];
  typeNameLabelMap: Record<string, string>;
  typeNameUiSchemaOptionsMap: Record<string, any>;
  primaryFields: PrimaryFieldDeclaration;
  uischemata?: Record<string, UISchemaElement>;
};

const SimilarityFinder = (props: EntityFinderProps) => {
  const { queryBuildOptions } = useAdbContext();
  const { dataStore } = useDataStore();
  const allKnowledgeBases = useMemo<FinderKnowledgeBaseDescription<any>[]>(
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

export const useRouterMock = () => {
  return {
    push: async (url) => {
      console.log("push", url);
    },
    replace: async (url) => {
      console.log("replace", url);
    },
    asPath: "",
    pathname: "",
    query: {},
    searchParams: {},
  } as ModRouter;
};

export const GraviolaProvider: React.FC<GraviolaProviderProps> = ({
  children,
  baseIRI,
  entityBaseIRI,
  schema,
  uischemata,
  primaryFields,
  renderers,
  cellRendererRegistry,
  typeNameLabelMap,
  typeNameUiSchemaOptionsMap,
}: GraviolaProviderProps) => {
  const endpoint: SparqlEndpoint = useMemo(() => {
    return {
      endpoint: "urn:worker",
      label: "SPARQL service",
      provider: "oxigraph",
      active: true,
    };
  }, []);

  const definitionToTypeIRI = (definitionName: string) =>
    `${baseIRI}${definitionName}`;

  const { registry } = useMemo(
    () =>
      createUISchemata(schema as JSONSchema7, {
        typeNameLabelMap,
        typeNameUiSchemaOptionsMap,
        definitionToTypeIRI,
      }),
    [schema, typeNameLabelMap, typeNameUiSchemaOptionsMap, definitionToTypeIRI],
  );

  const config = useMemo<GlobalSemanticConfig>(() => {
    const c = createSemanticConfig({ baseIRI });
    return {
      ...c,
      queryBuildOptions: {
        ...c.queryBuildOptions,
        primaryFields,
      },
    };
  }, [baseIRI, entityBaseIRI, primaryFields]);

  const makeStubSchema = useCallback(
    (schema: JSONSchema7) => {
      const stubSchema = createStubSchema(schema, {
        entityBaseIRI,
        definitionToTypeIRI,
      });

      return stubSchema;
    },
    [definitionToTypeIRI, entityBaseIRI],
  );

  const rendererRegistry = useMemo(
    () => [...allRenderers, ...(renderers || [])],
    [renderers],
  );

  // @ts-ignore
  return (
    <Provider store={store}>
      <AdbProvider
        {...config}
        env={{
          publicBasePath: "",
          baseIRI,
        }}
        components={{
          EditEntityModal: EditEntityModal,
          EntityDetailModal: EntityDetailModal,
          SemanticJsonForm: SemanticJsonFormNoOps,
          SimilarityFinder: SimilarityFinder,
        }}
        useRouterHook={useRouterMock}
        schema={schema}
        makeStubSchema={makeStubSchema}
        uiSchemaDefaultRegistry={registry}
        rendererRegistry={rendererRegistry}
        cellRendererRegistry={cellRendererRegistry}
        uischemata={uischemata}
      >
        <SparqlStoreProvider endpoint={endpoint} defaultLimit={20}>
          <LocalOxigraphStoreProvider
            endpoint={endpoint}
            defaultLimit={10}
            initialData={exampleDataTurtle}
            loader={<CircularProgress />}
          >
            <NiceModal.Provider>{children}</NiceModal.Provider>
          </LocalOxigraphStoreProvider>
        </SparqlStoreProvider>
        <ReactQueryDevtools initialIsOpen={true} />
      </AdbProvider>
    </Provider>
  );
};
