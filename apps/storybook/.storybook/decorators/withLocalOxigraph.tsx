import React from "react";
import type { Decorator } from "@storybook/react";
import { CircularProgress } from "@mui/material";
import { useQuery } from "@graviola/edb-state-hooks";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
//@ts-ignore
import tbbt from "tbbt-ld/dist/tbbt.nt";

const PUBLIC_BASE_PATH =
  (import.meta as any).env?.STORYBOOK_BASE_PATH ||
  (import.meta as any).env?.VITE_BASE_PATH ||
  "";

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
      const tbbtData = await fetch(tbbt).then((res) => res.text());
      return [data, ontology, tbbtData];
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

/**
 * Wraps the story in LocalOxigraphStoreProvider (in-browser Oxigraph WebWorker)
 * pre-loaded with the example exhibition + TBBT RDF data shipped with the
 * Storybook static assets.
 *
 * Use for stories that exercise components backed by the in-browser SPARQL
 * engine. Any hook calling useDataStore() will receive this provider's store
 * instance.
 *
 * @claim Without this decorator, components calling useDataStore() throw
 * "useCrudProvider must be used within a CrudProvider". Every story using this
 * decorator smoke-tests that the provider mounts without error.
 */
export const withLocalOxigraph: Decorator = (Story) => (
  <LocalStoreWithExampleDataProvider>
    <Story />
  </LocalStoreWithExampleDataProvider>
);
