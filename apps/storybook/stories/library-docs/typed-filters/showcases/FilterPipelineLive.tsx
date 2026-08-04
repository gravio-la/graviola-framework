import React, { useEffect, useMemo, useState } from "react";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { buildFilterableSPARQLQuery } from "@graviola/sparql-schema";
import { useDataStore } from "@graviola/edb-state-hooks";
import type { TableUiSchema } from "@graviola/edb-table-types";
import {
  GEO_VOCAB_BASE,
  geoSchema,
  geoTableUiSchema,
  geoTypeNameToTypeIRI,
} from "@graviola/sample-data-geo";

import {
  FilterPipelineShowcase,
  type FilterPipelineShowcaseProps,
} from "./FilterPipelineShowcase";

export type FilterPipelineLiveProps = {
  description: string;
  typeName: string;
  /** where / include / select / limit passed to filterMany + SPARQL builder */
  filterOptions: Record<string, unknown>;
  note?: string;
  expectedCount?: number;
  /** Cap results shown / fetched (maps to filterMany `limit` when set) */
  limit?: number;
  /**
   * CONSTRUCT recursion depth. Keep low when the schema has both forward
   * `contains` and inverse `parts` — deeper walks explode combinatorially.
   */
  maxRecursion?: number;
};

const PREFIX_MAP = {
  "": GEO_VOCAB_BASE,
  geo: GEO_VOCAB_BASE,
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  owl: "http://www.w3.org/2002/07/owl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
};

/**
 * Live wrapper: builds SPARQL via {@link buildFilterableSPARQLQuery} and
 * executes the same options through `dataStore.filterMany`.
 */
export const FilterPipelineLive: React.FC<FilterPipelineLiveProps> = ({
  description,
  typeName,
  filterOptions,
  note,
  expectedCount,
  limit,
  maxRecursion = 1,
}) => {
  const { dataStore, ready } = useDataStore();
  const [documents, setDocuments] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [status, setStatus] =
    useState<FilterPipelineShowcaseProps["status"]>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [elapsedMs, setElapsedMs] = useState<number | undefined>();

  const typeIRI = geoTypeNameToTypeIRI(typeName);
  const schemaForType = useMemo(
    () => bringDefinitionToTop(geoSchema, typeName),
    [typeName],
  );

  const sparqlQuery = useMemo(() => {
    const flavour =
      (filterOptions as { flavour?: string })?.flavour ?? "oxigraph";
    const { query } = buildFilterableSPARQLQuery(
      undefined,
      typeIRI,
      schemaForType,
      {
        ...filterOptions,
        prefixMap: PREFIX_MAP,
        flavour,
        maxRecursion,
      } as any,
    );
    return query;
  }, [typeIRI, schemaForType, filterOptions, maxRecursion]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!ready || !dataStore?.filterMany) {
        setStatus("loading");
        return;
      }
      setStatus("loading");
      setErrorMessage(undefined);
      const started = performance.now();
      try {
        const opts = {
          ...filterOptions,
          maxRecursion,
          ...(typeof limit === "number" ? { limit } : {}),
        };
        const result = await dataStore.filterMany(typeName, opts as any);
        if (cancelled) return;
        const rows = (result as Record<string, unknown>[]) ?? [];
        // Belt-and-braces: even if the store ignores options.limit (CONSTRUCT
        // has no LIMIT), the showcase must honour the story `limit` prop.
        setDocuments(typeof limit === "number" ? rows.slice(0, limit) : rows);
        setElapsedMs(Math.round(performance.now() - started));
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setDocuments(null);
        setElapsedMs(undefined);
        setErrorMessage(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [ready, dataStore, typeName, filterOptions, limit, maxRecursion]);

  return (
    <FilterPipelineShowcase
      description={description}
      typeName={typeName}
      filterOptions={filterOptions}
      sparqlQuery={sparqlQuery}
      prefixMap={PREFIX_MAP}
      schema={geoSchema}
      tableUiSchema={geoTableUiSchema as TableUiSchema}
      documents={documents}
      status={status === "idle" ? "loading" : status}
      errorMessage={errorMessage}
      elapsedMs={elapsedMs}
      note={note}
      expectedCount={expectedCount}
    />
  );
};
