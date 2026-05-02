import React from "react";
import type { Decorator } from "@storybook/react";
import { SparqlStoreProvider } from "@graviola/sparql-store-provider";
import type { SparqlEndpoint } from "@graviola/edb-core-types";

const defaultEndpoint: SparqlEndpoint = {
  label: "Local SPARQL endpoint",
  endpoint: "http://localhost:3030/ds",
  provider: "oxigraph",
  active: true,
};

/**
 * Wraps the story in SparqlStoreProvider pointed at a configurable endpoint.
 *
 * Use only for stories that verify behaviour against a real remote SPARQL
 * store. Tag such stories with 'requires-sparql' so CI can skip them when the
 * endpoint is unavailable.
 *
 * Configure per-story via parameters:
 *
 *   parameters: {
 *     sparqlEndpoint: {
 *       label: "Local SPARQL",
 *       endpoint: "http://localhost:3030/myds",
 *       provider: "oxigraph",
 *       active: true,
 *     },
 *   }
 */
export const withSparqlEndpoint: Decorator = (Story, context) => {
  const endpoint =
    (context.parameters?.sparqlEndpoint as SparqlEndpoint | undefined) ??
    defaultEndpoint;
  return (
    <SparqlStoreProvider endpoint={endpoint} defaultLimit={10}>
      <Story />
    </SparqlStoreProvider>
  );
};
