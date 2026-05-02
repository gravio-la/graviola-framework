import type { Preview } from "@storybook/react";
import React from "react";
import { CssBaseline } from "@mui/material";

// Define global process object for Node.js compatibility in browser
if (typeof window !== "undefined" && !window.process) {
  (window as any).process = {
    env: {},
  };
}

import { QueryClient, QueryClientProvider } from "@graviola/edb-state-hooks";
import { ThemeComponent } from "@graviola/edb-default-theme";
import NiceModal from "@ebay/nice-modal-react";
import "react-json-view-lite/dist/index.css";
import "@triply/yasgui/build/yasgui.min.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const preview: Preview = {
  parameters: {
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

// Store providers (LocalOxigraphStoreProvider, SparqlStoreProvider, etc.)
// are NOT registered globally. Each story that depends on a store must
// declare the appropriate named decorator from .storybook/decorators/.
// This makes the storage contract visible at the story level — readers
// can see which infrastructure a component requires without reading
// implementation code.
//
// Infrastructure providers (QueryClientProvider, ThemeComponent,
// LocalizationProvider, NiceModal.Provider, CssBaseline) remain global
// because they carry no semantic meaning about data storage.
const withInfrastructure = (Story: any) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ThemeComponent>
      <QueryClientProvider client={queryClient}>
        <NiceModal.Provider>
          <CssBaseline />
          <Story />
        </NiceModal.Provider>
      </QueryClientProvider>
    </ThemeComponent>
  </LocalizationProvider>
);

preview.decorators = [withInfrastructure];

export default preview;
