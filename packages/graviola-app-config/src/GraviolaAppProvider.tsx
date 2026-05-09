"use client";

import { type ComponentType, type FC, type ReactNode, useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  createSemanticConfig,
  createStubSchema,
  createUISchemata,
} from "@graviola/semantic-json-form";
import type { GlobalSemanticConfig } from "@graviola/semantic-jsonform-types";
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { IntentHandlersOverride } from "./defaultIntentDispatch";
import { defaultCellRenderers, defaultRenderers } from "./defaultRenderers";
import type { SchemaConfig } from "./types";
import { GraviolaLoungeProviders } from "./GraviolaLoungeProviders";

export type GraviolaAppProviderProps = {
  /**
   * Resolved schema configuration. Build with `defineGraviolaApp({ ... })`.
   */
  schemaConfig: SchemaConfig;
  /**
   * Children. The caller is responsible for composing a store provider
   * inside (e.g. `<LocalOxigraphStoreProvider>`, `<SparqlStoreProvider>`).
   * The package is intentionally storage-agnostic.
   */
  children: ReactNode;
  /**
   * Override the default renderer registry. When supplied, it is **appended**
   * to the package defaults (`materialRenderers + graviolaRenderers`); pass
   * `replaceRenderers` to swap them out entirely.
   */
  renderers?: JsonFormsRendererRegistryEntry[];
  replaceRenderers?: boolean;
  /** Override the default cell renderer registry (defaults to `materialCells`). */
  cellRendererRegistry?: JsonFormsCellRendererRegistryEntry[];
  /** Optional extra table actions. */
  tableActionRegistry?: unknown[];
  /** Show React Query devtools. Defaults to `false`. */
  enableDevtools?: boolean;
  /**
   * Public base path used in `AdbProvider.env`. Defaults to `""`. In a Vite
   * consumer, pass `import.meta.env.VITE_PUBLIC_BASE_PATH || import.meta.env.BASE_URL`.
   */
  publicBasePath?: string;
  /**
   * Replace or extend default intent handling (react-router + notistack).
   * Per-kind handlers run **instead of** the default for that kind.
   */
  intentHandlers?: IntentHandlersOverride;
  /**
   * Override NiceModal ids (`graviola:entity-detail`, `graviola:edit-entity`).
   */
  modalOverrides?: Record<string, ComponentType<any>>;
};

/**
 * Opinionated, storage-agnostic boot for a Graviola-driven app.
 *
 * Wires `react-redux` `store`, slim `AdbProvider`, intent bus + modal registry,
 * and optional React Query devtools. Place inside `BrowserRouter` and
 * `SnackbarProvider`. Store providers only supply `CrudProvider` + datastore;
 * mount `NiceModal.Provider` in the app (or Storybook `preview.tsx`) so modals
 * have a provider.
 */
export const GraviolaAppProvider: FC<GraviolaAppProviderProps> = ({
  schemaConfig,
  children,
  renderers,
  replaceRenderers,
  cellRendererRegistry,
  tableActionRegistry,
  enableDevtools,
  publicBasePath,
  intentHandlers,
  modalOverrides,
}) => {
  const {
    baseIRI,
    entityBaseIRI,
    schema,
    primaryFields,
    typeNameLabelMap,
    typeNameUiSchemaOptionsMap,
    uischemata,
  } = schemaConfig;

  const definitionToTypeIRI = useMemo(
    () => (definitionName: string) => `${baseIRI}${definitionName}`,
    [baseIRI],
  );

  const { registry } = useMemo(
    () =>
      createUISchemata(schema as JSONSchema7, {
        typeNameLabelMap,
        typeNameUiSchemaOptionsMap: typeNameUiSchemaOptionsMap as Record<
          string,
          object
        >,
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

  const makeStubSchema = useMemo(
    () => (s: JSONSchema7) =>
      createStubSchema(s, { entityBaseIRI, definitionToTypeIRI }),
    [entityBaseIRI, definitionToTypeIRI],
  );

  const rendererRegistry = useMemo<JsonFormsRendererRegistryEntry[]>(() => {
    if (replaceRenderers && renderers) {
      return renderers;
    }
    return [...defaultRenderers, ...(renderers ?? [])];
  }, [renderers, replaceRenderers]);

  const cellRegistry = cellRendererRegistry ?? defaultCellRenderers;
  const tableActions = tableActionRegistry ?? [];

  const resolvedPublicBasePath = publicBasePath ?? "";
  const showDevtools = enableDevtools ?? false;

  return (
    <ReduxProvider store={store}>
      <AdbProvider
        {...config}
        env={{
          publicBasePath: resolvedPublicBasePath,
          baseIRI,
        }}
        schema={schema}
        makeStubSchema={makeStubSchema}
        uiSchemaDefaultRegistry={registry}
        rendererRegistry={rendererRegistry}
        cellRendererRegistry={cellRegistry}
        uischemata={uischemata}
        tableActionRegistry={tableActions}
      >
        <GraviolaLoungeProviders
          intentHandlers={intentHandlers}
          modalOverrides={modalOverrides}
        >
          {children}
        </GraviolaLoungeProviders>
        {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </AdbProvider>
    </ReduxProvider>
  );
};
