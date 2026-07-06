import React from "react";
import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
import { createSemanticConfig } from "../../../../packages/semantic-json-form/src/helper/createSemanticConfig";

import {
  relationChipsPrimaryFields,
  relationChipsStorySchema,
  relationChipsTypeIRIToTypeName,
  relationChipsTypeNameToTypeIRI,
} from "../../stories/packages/semantic-views/relationChipsStorySchema";
import { storybookPublicBasePath } from "../../stories/_shared/storybookPublicUrl";

const PUBLIC_BASE_PATH = storybookPublicBasePath();

/** Adb for RelationChips stories (Manifestation / Realm / Artifact schema). */
export const withRelationChipsProvider: Decorator = (Story) => {
  const config = createSemanticConfig({
    baseIRI: "http://www.example.org/",
  });

  return (
    <MemoryRouter>
      <SnackbarProvider maxSnack={4}>
        <Provider store={store}>
          <AdbProvider
            {...config}
            schema={relationChipsStorySchema}
            typeNameToTypeIRI={relationChipsTypeNameToTypeIRI}
            typeIRIToTypeName={relationChipsTypeIRIToTypeName}
            queryBuildOptions={{
              ...config.queryBuildOptions,
              primaryFields: relationChipsPrimaryFields,
            }}
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
