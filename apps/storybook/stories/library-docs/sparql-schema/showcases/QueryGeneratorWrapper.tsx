import React, { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import {
  buildSPARQLConstructQuery,
  normalizedSchema2construct,
} from "@graviola/sparql-schema";
import type {
  GraphTraversalFilterOptions,
  Prefixes,
} from "@graviola/edb-core-types";
import { QueryGeneratorShowcase } from "./QueryGeneratorShowcase";

/**
 * Intermediate wrapper component that handles computation
 * and passes results to the pure display component.
 *
 * This is what gets used in Storybook stories with controls.
 */
export interface QueryGeneratorWrapperProps {
  /** JSON Schema to generate SPARQL from */
  schema: JSONSchema7;

  /** Subject IRI for the CONSTRUCT query */
  subjectIRI: string;

  /** Filter options (include, select, omit) */
  filterOptions: GraphTraversalFilterOptions;

  /** Prefix map for SPARQL namespace declarations */
  prefixMap: Prefixes;

  /** Optional title for the showcase */
  title?: string;

  /** Optional RDF triples (in N-Quads or Turtle format) for data loading */
  triples?: string;
}

export const QueryGeneratorWrapper: React.FC<QueryGeneratorWrapperProps> = ({
  schema,
  subjectIRI,
  filterOptions,
  prefixMap,
  title,
  triples,
}) => {
  const computedProps = useMemo(() => {
    const normalized = normalizeSchema(schema, {
      ...filterOptions,
      excludeJsonLdMetadata: true,
    });
    const constructResult = normalizedSchema2construct(
      subjectIRI,
      undefined,
      normalized as any,
      {
        prefixMap,
      },
    );
    const sparqlQuery = buildSPARQLConstructQuery(constructResult, prefixMap);

    return {
      schema,
      normalizedSchema: normalized,
      sparqlQuery,
      constructResult,
      prefixMap,
      title,
      triples,
    };
  }, [schema, subjectIRI, filterOptions, prefixMap, title, triples]);

  return <QueryGeneratorShowcase {...computedProps} />;
};
