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
import type { ResolveThumbnailUrl } from "@graviola/edb-core-types";
import { defs, extractTypeIRI } from "@graviola/json-schema-utils";
import type { GlobalSemanticConfig } from "@graviola/semantic-jsonform-types";
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

import type { IntentHandlersOverride } from "./defaultIntentDispatch";
import { defaultCellRenderers, defaultRenderers } from "./defaultRenderers";
import type { SchemaConfig, SideSchemaViewConfig } from "./types";
import { GraviolaLoungeProviders } from "./GraviolaLoungeProviders";

/**
 * Prefer each definition's `@type.const` over `baseIRI + name`.
 * LinkML models often put classes under `entityBaseIRI` while `baseIRI` is shorter —
 * using only `baseIRI + name` breaks dropdown search, form chips, and UISchema stubs.
 */
function typeIRIMapsFromSchema(schema: JSONSchema7): {
  typeNameToTypeIRI: (name: string) => string;
  typeIRIToTypeName: (iri: string) => string;
} {
  const nameToIri = new Map<string, string>();
  const iriToName = new Map<string, string>();
  for (const [name, def] of Object.entries(defs(schema))) {
    if (!def || typeof def === "boolean") continue;
    const iri = extractTypeIRI(def);
    if (!iri) continue;
    nameToIri.set(name, iri);
    iriToName.set(iri, name);
  }
  return {
    typeNameToTypeIRI: (name) => nameToIri.get(name) ?? name,
    typeIRIToTypeName: (iri) => iriToName.get(iri) ?? iri,
  };
}

function buildAdbViewConfig(
  detailUiSchemata: SchemaConfig["detailUiSchemata"],
  sideView: SideSchemaViewConfig["detail"] | undefined,
): import("@graviola/semantic-jsonform-types").ViewConfigSet | undefined {
  if (!detailUiSchemata && !sideView) return undefined;

  return {
    detail: {
      uiSchemata: {
        ...(sideView?.uiSchemata ?? {}),
        ...(detailUiSchemata ?? {}),
      },
      ...(sideView?.detailLayoutType != null
        ? { detailLayoutType: sideView.detailLayoutType }
        : {}),
      ...(sideView?.nesting != null ? { nesting: sideView.nesting } : {}),
      ...(sideView?.article != null ? { article: sideView.article } : {}),
      ...(sideView?.maxDepth != null ? { maxDepth: sideView.maxDepth } : {}),
      ...(sideView?.hideLinkedDataProperties != null
        ? { hideLinkedDataProperties: sideView.hideLinkedDataProperties }
        : {}),
      ...(sideView?.linkedDataPropertyNames != null
        ? { linkedDataPropertyNames: sideView.linkedDataPropertyNames }
        : {}),
      ...(sideView?.hideHeaderPrimaryFields != null
        ? { hideHeaderPrimaryFields: sideView.hideHeaderPrimaryFields }
        : {}),
      ...(sideView?.hiddenPropertyNames != null
        ? { hiddenPropertyNames: sideView.hiddenPropertyNames }
        : {}),
      ...(sideView?.alwaysShowPropertyNames != null
        ? { alwaysShowPropertyNames: sideView.alwaysShowPropertyNames }
        : {}),
    },
  };
}

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
  /** Optional extra table actions. @deprecated Use entityActionRegistry. */
  tableActionRegistry?: unknown[];
  entityActionRegistry?: import("@graviola/edb-detail-renderer-core").EntityActionEntry[];
  hostCapabilities?: import("@graviola/edb-core-types").HostCapabilityDeclaration;
  defaultViewDensity?: import("@graviola/edb-core-types").ViewDensity;
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
  /**
   * Optional display-time image URL rewrite forwarded to `AdbProvider`.
   */
  resolveThumbnailUrl?: ResolveThumbnailUrl;
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
  entityActionRegistry,
  enableDevtools,
  publicBasePath,
  intentHandlers,
  modalOverrides,
  resolveThumbnailUrl,
  hostCapabilities,
  defaultViewDensity,
}) => {
  const {
    baseIRI,
    entityBaseIRI,
    schema,
    primaryFields,
    typeNameLabelMap,
    typeNameUiSchemaOptionsMap,
    uischemata,
    detailUiSchemata,
    tableUiSchemaByType,
    tableUiSchema,
    menuUISchema,
    menuSidebarConfig,
    viewConfig: sideViewConfig,
  } = schemaConfig;

  const schemaAsJson = schema as JSONSchema7;

  const { typeNameToTypeIRI, typeIRIToTypeName } = useMemo(
    () => typeIRIMapsFromSchema(schemaAsJson),
    [schemaAsJson],
  );

  /** Fall back to baseIRI+name when a definition has no `@type.const`. */
  const definitionToTypeIRI = useMemo(
    () => (definitionName: string) => {
      const fromSchema = typeNameToTypeIRI(definitionName);
      if (fromSchema !== definitionName) return fromSchema;
      return `${baseIRI}${definitionName}`;
    },
    [typeNameToTypeIRI, baseIRI],
  );

  const { registry } = useMemo(
    () =>
      createUISchemata(schemaAsJson, {
        typeNameLabelMap,
        typeNameUiSchemaOptionsMap: typeNameUiSchemaOptionsMap as Record<
          string,
          object
        >,
        definitionToTypeIRI,
      }),
    [
      schemaAsJson,
      typeNameLabelMap,
      typeNameUiSchemaOptionsMap,
      definitionToTypeIRI,
    ],
  );

  // Property IRIs and new entity IRIs follow entityBaseIRI when set (matches
  // LinkML `@type.const` and typical seed/fixture namespaces).
  const defaultPrefix = entityBaseIRI || baseIRI;

  const config = useMemo<GlobalSemanticConfig>(() => {
    const c = createSemanticConfig({ baseIRI, defaultPrefix });
    const resolveTypeName = (iri: string) => {
      const mapped = typeIRIToTypeName(iri);
      if (mapped !== iri) return mapped;
      return c.typeIRIToTypeName(iri);
    };
    return {
      ...c,
      typeNameToTypeIRI: definitionToTypeIRI,
      typeIRIToTypeName: resolveTypeName,
      createEntityIRI: (typeName: string, id?: string) => {
        const uuid = id || Math.random().toString(36).substring(2, 15);
        // Keep individuals under entityBaseIRI; type local-name only.
        return `${defaultPrefix}${typeName}/${uuid}`;
      },
      jsonLDConfig: {
        ...c.jsonLDConfig,
        defaultPrefix,
        jsonldContext: {
          ...(typeof c.jsonLDConfig.jsonldContext === "object" &&
          c.jsonLDConfig.jsonldContext !== null
            ? c.jsonLDConfig.jsonldContext
            : {}),
          "@vocab": defaultPrefix,
        },
      },
      queryBuildOptions: {
        ...c.queryBuildOptions,
        primaryFields,
        typeIRItoTypeName: resolveTypeName,
      },
    };
  }, [
    baseIRI,
    defaultPrefix,
    primaryFields,
    definitionToTypeIRI,
    typeIRIToTypeName,
  ]);

  const makeStubSchema = useMemo(
    () => (s: JSONSchema7) =>
      createStubSchema(s, {
        entityBaseIRI: defaultPrefix,
        definitionToTypeIRI,
      }),
    [defaultPrefix, definitionToTypeIRI],
  );

  const rendererRegistry = useMemo<JsonFormsRendererRegistryEntry[]>(() => {
    if (replaceRenderers && renderers) {
      return renderers;
    }
    return [...defaultRenderers, ...(renderers ?? [])];
  }, [renderers, replaceRenderers]);

  const cellRegistry = cellRendererRegistry ?? defaultCellRenderers;
  const tableActions = tableActionRegistry ?? [];
  const entityActions = entityActionRegistry ?? [];

  const resolvedPublicBasePath = publicBasePath ?? "";
  const showDevtools = enableDevtools ?? false;

  const viewConfig = useMemo(
    () => buildAdbViewConfig(detailUiSchemata, sideViewConfig?.detail),
    [detailUiSchemata, sideViewConfig],
  );

  // Keep table/menu sidecars reachable for apps that read them from Adb context
  // via schemaConfig or a future table provider; surface them on env for now.
  void tableUiSchemaByType;
  void tableUiSchema;
  void menuUISchema;
  void menuSidebarConfig;

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
        viewConfig={viewConfig}
        tableActionRegistry={tableActions}
        entityActionRegistry={entityActions}
        defaultViewDensity={defaultViewDensity}
        resolveThumbnailUrl={resolveThumbnailUrl}
      >
        <GraviolaLoungeProviders
          intentHandlers={intentHandlers}
          modalOverrides={modalOverrides}
          hostCapabilities={hostCapabilities}
          defaultViewDensity={defaultViewDensity}
        >
          {children}
        </GraviolaLoungeProviders>
        {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </AdbProvider>
    </ReduxProvider>
  );
};
