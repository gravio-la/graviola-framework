import React from "react";
import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
import { Provider } from "react-redux";
import { createSemanticConfig } from "@graviola/semantic-json-form";
import { GraviolaLoungeProviders } from "@graviola/graviola-app-config";

import { withLocalOxigraph } from "./withLocalOxigraph";
import { storybookPublicBasePath } from "../../stories/_shared/storybookPublicUrl";

const BASE_IRI = "http://ontologies.slub-dresden.de/exhibition#";
const PUBLIC_BASE_PATH = storybookPublicBasePath();

/**
 * Wraps the story in the full Graviola application context: Redux store,
 * slim `AdbProvider`, lounge shell (intent bus, modal registry, form/finder
 * slots, pathname), and a Local Oxigraph store pre-loaded with example RDF
 * data.
 *
 * `NiceModal.Provider` is supplied globally in `.storybook/preview.tsx` (not
 * by store provider packages).
 *
 * Use this for stories that exercise components needing `useAdbContext`,
 * `useExtendedSchema`, or the full semantic CRUD pipeline (EntityFinder,
 * SemanticJsonFormNoOps, DiscoverSearchTable, etc.).
 *
 * For stories that only need the in-browser SPARQL store but no AdbContext,
 * prefer withLocalOxigraph alone.
 */
export const withGraviolaProvider: Decorator = (Story, context) => {
  const config = createSemanticConfig({ baseIRI: BASE_IRI });

  return (
    <MemoryRouter>
      <SnackbarProvider maxSnack={4}>
        <Provider store={store}>
          <AdbProvider
            {...config}
            schema={{}}
            env={{
              publicBasePath: PUBLIC_BASE_PATH,
              baseIRI: BASE_IRI,
            }}
          >
            <GraviolaLoungeProviders>
              {withLocalOxigraph(Story, context)}
            </GraviolaLoungeProviders>
          </AdbProvider>
        </Provider>
      </SnackbarProvider>
    </MemoryRouter>
  );
};
