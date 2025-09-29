import {
  AdbProvider,
  EdbGlobalContextProps,
  store,
} from "@graviola/edb-state-hooks";
import { Provider } from "react-redux";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/de";
import "dayjs/locale/en";
import { BASE_IRI, PUBLIC_BASE_PATH } from "../components/config";
import { SnackbarProvider, useSnackbar } from "notistack";
import { useRouterHook } from "./useRouterHook";
import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { exhibitionConfig } from "../components/config/exhibitionAppConfig";
import { kulinarikAppConfig } from "../components/config/kulinarikAppConfig";
import { envToSparqlEndpoint } from "@graviola/edb-core-utils";
import {
  EditEntityModal,
  EntityDetailModal,
} from "@graviola/edb-advanced-components";
import { SimilarityFinder } from "../components/form/similarity-finder";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeComponent } from "@graviola/edb-default-theme";
import { SparqlStoreProvider } from "@graviola/sparql-store-provider";
import "react-json-view-lite/dist/index.css";
import "@triply/yasgui/build/yasgui.min.css";
import { availableAuthorityMappings } from "@slub/exhibition-schema";
import { Box, CircularProgress } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SemanticJsonFormNoOps } from "@graviola/semantic-json-form";

export const queryClient = new QueryClient();

const sparqlEndpoint = envToSparqlEndpoint(import.meta.env, "VITE");
console.log(sparqlEndpoint);
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const appConfig =
  import.meta.env.VITE_APP_MANIFESTATION === "kulinarik"
    ? kulinarikAppConfig
    : exhibitionConfig;

const Loading = () => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export const App = ({ children }: { children?: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Provider store={store}>
          <ThemeComponent>
            <SnackbarProvider>
              <AdbProvider
                {...appConfig}
                lockedSPARQLEndpoint={sparqlEndpoint}
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
                useSnackbar={useSnackbar}
                useRouterHook={useRouterHook}
                normDataMapping={availableAuthorityMappings}
              >
                <GoogleOAuthProvider clientId={googleClientId}>
                  <SparqlStoreProvider
                    endpoint={sparqlEndpoint}
                    defaultLimit={100}
                    walkerOptions={{
                      maxRecursion: 2,
                    }}
                  >
                    <NiceModal.Provider>{children}</NiceModal.Provider>
                  </SparqlStoreProvider>
                </GoogleOAuthProvider>
              </AdbProvider>
            </SnackbarProvider>
          </ThemeComponent>
        </Provider>
      </LocalizationProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
