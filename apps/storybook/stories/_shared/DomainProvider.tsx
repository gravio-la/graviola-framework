import React, { useMemo } from "react";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";

import {
  AdbProvider,
  CrudProviderContext,
  FinderSlotProvider,
  store,
  useExtendedSchema,
} from "@graviola/edb-state-hooks";
import {
  SemanticJsonFormNoOps,
  graviolaRenderers,
} from "@graviola/semantic-json-form";
import { createSemanticConfig } from "../../../../packages/semantic-json-form/src/helper/createSemanticConfig";
import { createUISchemata } from "../../../../packages/semantic-json-form/src/helper/createUISchemata";

const dashboardRenderers = [...materialRenderers, ...graviolaRenderers];

/** Finder is disabled on the dashboard; this satisfies useFinderSlot without pulling in the full app shell. */
const NoopFinder = () => null;

/**
 * Stub CRUD context so store-aware components (tables, linked-data renderers) mount and show the full
 * picture from inline data. No real datastore — load/save are no-ops. Replace with a live store later.
 */
const STUB_CRUD_VALUE = {
  crudOptions: null,
  dataStore: null,
  isReady: true,
} as const;

import type { StoryDomain } from "./storyDomains";

const PUBLIC_BASE_PATH =
  (
    import.meta as {
      env?: { STORYBOOK_BASE_PATH?: string; VITE_BASE_PATH?: string };
    }
  ).env?.STORYBOOK_BASE_PATH ||
  (import.meta as { env?: { VITE_BASE_PATH?: string } }).env?.VITE_BASE_PATH ||
  "";

type DomainProviderProps = {
  domain: StoryDomain;
  children: React.ReactNode;
};

/** Parameterized AdbProvider for dashboard and structural-dispatch showcases (no Oxigraph). */
export function DomainProvider({ domain, children }: DomainProviderProps) {
  const semanticConfig = useMemo(
    () =>
      createSemanticConfig({
        baseIRI: domain.baseIRI,
        defaultPrefix: domain.baseIRI,
      }),
    [domain.baseIRI],
  );

  const { registry, map: uischemata } = useMemo(
    () =>
      createUISchemata(domain.schema, {
        definitionToTypeIRI: domain.typeNameToTypeIRI,
        typeNameLabelMap: domain.typeNameLabelMap,
      }),
    [domain.schema, domain.typeNameLabelMap, domain.typeNameToTypeIRI],
  );

  return (
    <MemoryRouter>
      <SnackbarProvider maxSnack={4}>
        <Provider store={store}>
          <AdbProvider
            key={domain.id}
            {...semanticConfig}
            schema={domain.schema}
            typeNameToTypeIRI={domain.typeNameToTypeIRI}
            typeIRIToTypeName={domain.typeIRIToTypeName}
            queryBuildOptions={{
              ...semanticConfig.queryBuildOptions,
              primaryFields: domain.primaryFields,
            }}
            typePresentation={domain.typePresentation}
            rendererRegistry={dashboardRenderers}
            cellRendererRegistry={materialCells}
            uiSchemaDefaultRegistry={registry}
            uischemata={uischemata}
            env={{
              publicBasePath: PUBLIC_BASE_PATH,
              baseIRI: domain.baseIRI,
            }}
          >
            <CrudProviderContext.Provider value={STUB_CRUD_VALUE}>
              <FinderSlotProvider Component={NoopFinder}>
                {children}
              </FinderSlotProvider>
            </CrudProviderContext.Provider>
          </AdbProvider>
        </Provider>
      </SnackbarProvider>
    </MemoryRouter>
  );
}

type DashboardFormPreviewProps = {
  typeName: string;
  data: Record<string, unknown>;
};

/** Form card preview: needs DomainProvider ancestor. */
export function DashboardFormPreview({
  typeName,
  data,
}: DashboardFormPreviewProps) {
  const typeIRI = data["@type"] as string;
  const schema = useExtendedSchema({ typeName });
  const [formData, setFormData] = React.useState(data);

  React.useEffect(() => {
    setFormData(data);
  }, [data]);

  if (!schema) {
    return null;
  }

  return (
    <SemanticJsonFormNoOps
      data={formData}
      onChange={(next) => setFormData(next ?? formData)}
      typeIRI={typeIRI}
      schema={schema}
      searchText=""
      disableSimilarityFinder
      wrapWithinCard={false}
    />
  );
}
