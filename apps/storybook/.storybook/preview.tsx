import type { Preview } from "@storybook/react";
import React from "react";
import { CssBaseline, CircularProgress } from "@mui/material";

// Define global process object for Node.js compatibility in browser
if (typeof window !== "undefined" && !window.process) {
  (window as any).process = {
    env: {},
  };
}
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@graviola/edb-state-hooks";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  EntityDetailModal,
  EditEntityModal,
  KBMainDatabase,
} from "@graviola/edb-advanced-components";
import { EntityFinder } from "@graviola/entity-finder";
import { Provider } from "react-redux";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import "@triply/yasgui/build/yasgui.min.css";
import {
  SemanticJsonFormNoOps,
  createSemanticConfig,
} from "@graviola/semantic-json-form";
import { ThemeComponent } from "@graviola/edb-default-theme";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
import NiceModal from "@ebay/nice-modal-react";
import "react-json-view-lite/dist/index.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type {
  EntityFinderProps,
  FinderKnowledgeBaseDescription,
  ModRouter,
  Url,
} from "@graviola/semantic-jsonform-types";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";

// Hardcoded values for Storybook
const BASE_IRI = "http://ontologies.slub-dresden.de/exhibition#";
const PUBLIC_BASE_PATH = "";

const preview: Preview = {
  parameters: {
    nextRouter: {
      Provider: AppRouterContext.Provider,
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

const queryClient = new QueryClient();

// Modern SimilarityFinder component
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

const LocalStoreWithExampleDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data } = useQuery({
    queryKey: ["exampleData"],
    queryFn: async () => {
      const basePath = PUBLIC_BASE_PATH || "";
      const data = await fetch(basePath + "/example-exhibitions.ttl").then(
        (res) => res.text(),
      );
      const ontology = await fetch(
        basePath + "/ontology/exhibition-info.owl.ttl",
      ).then((res) => res.text());
      return [data, ontology];
    },
  });

  return (
    <LocalOxigraphStoreProvider
      endpoint={{
        endpoint: "urn:worker",
        label: "Local",
        provider: "worker",
        active: true,
      }}
      defaultLimit={10}
      initialData={data}
      loader={<CircularProgress />}
    >
      {children}
    </LocalOxigraphStoreProvider>
  );
};

export const useRouterMock = (): ModRouter => {
  return {
    push: async (url: Url) => {
      console.log("push", url);
    },
    replace: async (url: Url) => {
      console.log("replace", url);
    },
    asPath: "",
    pathname: "",
    query: {},
    searchParams: new URLSearchParams(),
  };
};

export const withGraviolaProvider = (Story: any) => {
  console.log("PUBLIC_BASE_PATH", PUBLIC_BASE_PATH);

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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeComponent>
            <QueryClientProvider client={queryClient}>
              <LocalStoreWithExampleDataProvider>
                <NiceModal.Provider>
                  <CssBaseline />
                  <Story />
                </NiceModal.Provider>
              </LocalStoreWithExampleDataProvider>
            </QueryClientProvider>
          </ThemeComponent>
        </LocalizationProvider>
      </AdbProvider>
    </Provider>
  );
};

preview.decorators = [withGraviolaProvider];

export default preview;
