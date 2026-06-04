import React from "react";
import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
// Avoid `@graviola/semantic-json-form` barrel — it re-exports defaults/linkedDataRenderer → n3 in the browser.
import { createSemanticConfig } from "../../../../packages/semantic-json-form/src/helper/createSemanticConfig";

import {
  semanticViewsPrimaryFields,
  semanticViewsStorySchema,
  semanticViewsTypeIRIToTypeName,
  semanticViewsTypeNameToTypeIRI,
  semanticViewsTypePresentation,
} from "../../stories/packages/semantic-views/semanticViewsStorySchema";

const PUBLIC_BASE_PATH =
  (import.meta as any).env?.STORYBOOK_BASE_PATH ||
  (import.meta as any).env?.VITE_BASE_PATH ||
  "";

/** Adb + Oxigraph for {@link @graviola/semantic-views} stories (item-catalog schema, not exhibition). */
export const withSemanticViewsProvider: Decorator = (Story) => {
  const config = createSemanticConfig({
    baseIRI: "http://www.example.org/",
  });

  return (
    <MemoryRouter>
      <SnackbarProvider maxSnack={4}>
        <Provider store={store}>
          <AdbProvider
            {...config}
            schema={semanticViewsStorySchema}
            typeNameToTypeIRI={semanticViewsTypeNameToTypeIRI}
            typeIRIToTypeName={semanticViewsTypeIRIToTypeName}
            queryBuildOptions={{
              ...config.queryBuildOptions,
              primaryFields: semanticViewsPrimaryFields,
            }}
            typePresentation={semanticViewsTypePresentation}
            env={{
              publicBasePath: PUBLIC_BASE_PATH,
              baseIRI: "http://www.example.org/",
            }}
          >
            <Story />
          </AdbProvider>
        </Provider>
      </SnackbarProvider>
    </MemoryRouter>
  );
};
