"use client";

import NiceModal from "@ebay/nice-modal-react";
import React, { useCallback, useMemo } from "react";
import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  PrimaryFieldDeclaration,
  SparqlEndpoint,
} from "@graviola/edb-core-types";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
import { Provider } from "react-redux";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  SPARQLQueryDevtools,
  sparqlDevtoolsLogQuery,
} from "@graviola/edb-debug-utils";
import {
  createSemanticConfig,
  createUISchemata,
  createStubSchema,
} from "@graviola/semantic-json-form";
import { GlobalSemanticConfig } from "@graviola/semantic-jsonform-types";
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  UISchemaElement,
} from "@jsonforms/core";
import { JSONSchema7 } from "json-schema";
import { allRenderers } from "./config";
import { CircularProgress } from "@mui/material";
import type { MetaStampingConfig } from "@graviola/meta-schema";

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
  /** Schema for reads/UI (may include grafted `$meta`). Writes validate against domain shape. */
  displaySchema?: JSONSchema7;
  /** Opt-in entity-level $meta stamping (P1 milestone demo). */
  metaStamping?: MetaStampingConfig;
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
  displaySchema,
  metaStamping,
}: GraviolaProviderProps) => {
  const schemaForUi = displaySchema ?? schema;
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
  const tableActionRegistry = useMemo(() => [], []);
  const publicBasePath =
    import.meta.env.VITE_PUBLIC_BASE_PATH || import.meta.env.BASE_URL || "";

  return (
    <Provider store={store}>
      <AdbProvider
        {...config}
        env={{
          publicBasePath,
          baseIRI,
        }}
        schema={schemaForUi}
        makeStubSchema={makeStubSchema}
        uiSchemaDefaultRegistry={registry}
        rendererRegistry={rendererRegistry}
        cellRendererRegistry={cellRendererRegistry}
        uischemata={uischemata}
        tableActionRegistry={tableActionRegistry}
      >
        <GraviolaLoungeProviders>
          <LocalOxigraphStoreProvider
            key={storageKey}
            endpoint={endpoint}
            defaultLimit={10}
            enableInversePropertiesFeature={true}
            initialData={initialData ?? ""}
            localPersistence={{
              enabled: true,
              restoreOnLoad: true,
              debounceMS: 5000,
              storageKey,
            }}
            metaStamping={metaStamping}
            loader={<CircularProgress />}
          >
            <NiceModal.Provider>
              {import.meta.env.DEV ? (
                <SPARQLQueryDevtools initialIsOpen={false} />
              ) : null}
              {children}
              <ReactQueryDevtools initialIsOpen={true} />
            </NiceModal.Provider>
          </LocalOxigraphStoreProvider>
        </GraviolaLoungeProviders>
      </AdbProvider>
    </Provider>
  );
};
