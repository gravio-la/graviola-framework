import React from "react";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { AdbProvider, store } from "@graviola/edb-state-hooks";
import { MotionAdapterProvider } from "@graviola/edb-detail-renderer";
import { createSemanticConfig } from "../../../../packages/semantic-json-form/src/helper/createSemanticConfig";

import {
  cardShowcasePresentation,
  cardShowcasePrimaryFields,
  cardShowcaseStorySchema,
  cardShowcaseTypeIRIToTypeName,
  cardShowcaseTypeNameToTypeIRI,
  cardShowcaseTypePresentation,
} from "../packages/semantic-views/cardShowcaseStorySchema";
import { StorybookMotionAdapter } from "../../.storybook/decorators/storybookMotionAdapter";
import { storybookPublicBasePath } from "./storybookPublicUrl";

const PUBLIC_BASE_PATH = storybookPublicBasePath();

/**
 * Card showcase Adb + motion wiring without a Router.
 * Use when an ancestor already provides `MemoryRouter` (e.g. dashboard `DomainProvider`).
 */
export function CardShowcaseProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = createSemanticConfig({
    baseIRI: "http://www.example.org/",
  });

  return (
    <SnackbarProvider maxSnack={4}>
      <Provider store={store}>
        <AdbProvider
          {...config}
          schema={cardShowcaseStorySchema}
          typeNameToTypeIRI={cardShowcaseTypeNameToTypeIRI}
          typeIRIToTypeName={cardShowcaseTypeIRIToTypeName}
          queryBuildOptions={{
            ...config.queryBuildOptions,
            primaryFields: cardShowcasePrimaryFields,
          }}
          typePresentation={cardShowcaseTypePresentation}
          cardPresentation={cardShowcasePresentation}
          env={{
            publicBasePath: PUBLIC_BASE_PATH,
            baseIRI: "http://www.example.org/",
          }}
        >
          <MotionAdapterProvider adapter={StorybookMotionAdapter}>
            {children}
          </MotionAdapterProvider>
        </AdbProvider>
      </Provider>
    </SnackbarProvider>
  );
}

/**
 * Self-contained shell for MDX / isolated stories (includes its own `MemoryRouter`).
 */
export function CardShowcaseShell({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <CardShowcaseProviders>{children}</CardShowcaseProviders>
    </MemoryRouter>
  );
}
