import type { Preview } from "@storybook/react";
import React from "react";
import { CssBaseline } from "@mui/material";
import { Buffer } from "buffer";

// Define global process object for Node.js compatibility in browser
if (typeof window !== "undefined" && !window.process) {
  (window as any).process = {
    env: {},
  };
}

// n3 -> safe-buffer expects a global Buffer in browser bundles.
if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

import { QueryClient, QueryClientProvider } from "@graviola/edb-state-hooks";
import { ThemeComponent } from "@graviola/edb-default-theme";
import NiceModal from "@ebay/nice-modal-react";
import "react-json-view-lite/dist/index.css";
import "@triply/yasgui/build/yasgui.min.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

/** MDX links run in the preview iframe; internal ?path= links must navigate the parent shell. */
function StorybookLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href) return;

    const isExternal =
      /^https?:\/\//.test(href) && !href.includes(window.location.hostname);
    const isAnchor = href.startsWith("#");

    if (isExternal || isAnchor) return;

    e.preventDefault();
    window.parent.location.href = href;
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      codePanel: true,
    },
    options: {
      storySort: {
        order: [
          "Welcome",
          "Structural Dispatch",
          [
            "Overview",
            "Semantic Forms",
            "Semantic Chips",
            "Semantic Detail Views",
            "Semantic Cards",
            "Semantic List Views",
            "Semantic Tables",
            "Showcases",
          ],
          "Library Docs",
          "Architecture",
          "Packages",
          "semantic-views",
          "Example",
        ],
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

preview.parameters.docs = {
  ...preview.parameters.docs,
  components: { a: StorybookLink },
};

export default preview;
