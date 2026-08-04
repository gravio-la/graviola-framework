import React from "react";
import type { Decorator } from "@storybook/react";
import { CircularProgress } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  GEO_INSTANCE_BASE,
  GEO_VOCAB_BASE,
  geoPrimaryFields,
  geoSchema,
  geoTurtle,
  geoTypeIRIToTypeName,
  geoTypeNameToTypeIRI,
} from "@graviola/sample-data-geo";
// Avoid `@graviola/semantic-json-form` barrel — it re-exports defaults/linkedDataRenderer → n3 in the browser.
import { createSemanticConfig } from "../../../../packages/semantic-json-form/src/helper/createSemanticConfig";

import { storybookPublicBasePath } from "../../stories/_shared/storybookPublicUrl";

const PUBLIC_BASE_PATH = storybookPublicBasePath();

/**
 * AdbProvider + LocalOxigraph preloaded with the committed geo sample Turtle.
 * Property/type IRIs resolve under {@link GEO_VOCAB_BASE}; instance IRIs under
 * {@link GEO_INSTANCE_BASE}.
 */
export const withGeoSampleData: Decorator = (Story) => {
  const config = createSemanticConfig({
    baseIRI: GEO_INSTANCE_BASE,
    defaultPrefix: GEO_VOCAB_BASE,
  });

  return (
    <MemoryRouter>
      <SnackbarProvider maxSnack={4}>
        <Provider store={store}>
          <AdbProvider
            {...config}
            schema={geoSchema}
            typeNameToTypeIRI={geoTypeNameToTypeIRI}
            typeIRIToTypeName={(iri) => geoTypeIRIToTypeName(iri) ?? ""}
            createEntityIRI={(typeName, id) =>
              `${GEO_INSTANCE_BASE}${typeName}/${id ?? crypto.randomUUID()}`
            }
            queryBuildOptions={{
              ...config.queryBuildOptions,
              primaryFields: geoPrimaryFields,
              // Oxigraph supports SEP-0006 LATERAL — use it for nested take/orderBy
              sparqlFlavour: "oxigraph",
            }}
            env={{
              publicBasePath: PUBLIC_BASE_PATH,
              baseIRI: GEO_INSTANCE_BASE,
            }}
          >
            <LocalOxigraphStoreProvider
              endpoint={{
                endpoint: "urn:worker",
                label: "Geo sample",
                provider: "worker",
                active: true,
              }}
              defaultLimit={50}
              initialData={[geoTurtle]}
              loader={<CircularProgress />}
            >
              <Story />
            </LocalOxigraphStoreProvider>
          </AdbProvider>
        </Provider>
      </SnackbarProvider>
    </MemoryRouter>
  );
};
