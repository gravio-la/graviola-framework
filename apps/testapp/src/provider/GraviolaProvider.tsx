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
import { IndexedDBStoreProvider } from "@graviola/indexeddb-store-provider";
import { Provider } from "react-redux";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  SPARQLQueryDevtools,
  sparqlDevtoolsLogQuery,
} from "@graviola/edb-debug-utils";
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
} from "@graviola/semantic-jsonform-types";
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  UISchemaElement,
} from "@jsonforms/core";
import { JSONSchema7 } from "json-schema";
import { allRenderers } from "./config";
import { CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import { useRouterHook } from "../useRouterHook";

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
  storageKey: string;
  initialData?: string;
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
  storageKey,
  initialData,
}: GraviolaProviderProps) => {
  const endpoint: SparqlEndpoint = useMemo(() => {
    return {
      endpoint: "urn:worker",
      label: "SPARQL service",
      provider: "oxigraph",
      active: true,
      ...(import.meta.env.DEV ? { logQuery: sparqlDevtoolsLogQuery } : {}),
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
  }, [baseIRI, primaryFields]);

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
        useRouterHook={useRouterHook}
        useSnackbar={useSnackbar}
        schema={schema}
        makeStubSchema={makeStubSchema}
        uiSchemaDefaultRegistry={registry}
        rendererRegistry={rendererRegistry}
        cellRendererRegistry={cellRendererRegistry}
        uischemata={uischemata}
      >
        <SparqlStoreProvider
          endpoint={endpoint}
          defaultLimit={20}
          enableInversePropertiesFeature={true}
        >
          <IndexedDBStoreProvider
            key={storageKey}
            dbName={storageKey}
            defaultLimit={10}
            initialData={initialData}
            loader={<CircularProgress />}
          >
            {import.meta.env.DEV ? (
              <SPARQLQueryDevtools initialIsOpen={false} />
            ) : null}
            <NiceModal.Provider>{children}</NiceModal.Provider>
          </IndexedDBStoreProvider>
        </SparqlStoreProvider>
        <ReactQueryDevtools initialIsOpen={true} />
      </AdbProvider>
    </Provider>
  );
};
