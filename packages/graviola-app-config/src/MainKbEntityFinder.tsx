"use client";

import { useMemo } from "react";
import { KBMainDatabase } from "@graviola/edb-advanced-components";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import { EntityFinder } from "@graviola/entity-finder";
import type {
  EntityFinderProps,
  FinderKnowledgeBaseDescription,
} from "@graviola/semantic-jsonform-types";

/**
 * Default similarity finder: single knowledge base backed by the app's
 * configured {@link useDataStore} + primary fields.
 */
export const MainKbEntityFinder = (props: EntityFinderProps) => {
  const { queryBuildOptions } = useAdbContext();
  const { dataStore } = useDataStore();
  const allKnowledgeBases = useMemo<FinderKnowledgeBaseDescription<any>[]>(
    () =>
      dataStore
        ? [
            KBMainDatabase(
              dataStore,
              queryBuildOptions.primaryFields,
              queryBuildOptions.typeIRItoTypeName,
            ),
          ]
        : [],
    [
      dataStore,
      queryBuildOptions.primaryFields,
      queryBuildOptions.typeIRItoTypeName,
    ],
  );
  return <EntityFinder {...props} allKnowledgeBases={allKnowledgeBases} />;
};
