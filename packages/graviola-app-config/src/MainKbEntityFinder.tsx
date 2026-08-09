"use client";

import { useMemo } from "react";
import { KBMainDatabase } from "@graviola/edb-advanced-components";
import {
  createWikidataKnowledgeBase,
  WIKIDATA_AUTHORITY,
} from "@graviola/edb-advanced-components";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import { EntityFinder } from "@graviola/entity-finder";
import type {
  EntityFinderProps,
  FinderKnowledgeBaseDescription,
} from "@graviola/semantic-jsonform-types";

/**
 * Default similarity finder: local KB plus Wikidata when
 * `normDataMapping[wikidata].sameAsTypeMap` is configured.
 */
export const MainKbEntityFinder = (props: EntityFinderProps) => {
  const { queryBuildOptions, normDataMapping = {} } = useAdbContext();
  const { dataStore } = useDataStore();
  const allKnowledgeBases = useMemo<
    FinderKnowledgeBaseDescription<any>[]
  >(() => {
    const bases: FinderKnowledgeBaseDescription<any>[] = [];
    if (dataStore) {
      bases.push(
        KBMainDatabase(
          dataStore,
          queryBuildOptions.primaryFields,
          queryBuildOptions.typeIRItoTypeName,
        ),
      );
    }
    const wd = normDataMapping[WIKIDATA_AUTHORITY];
    if (wd?.sameAsTypeMap) {
      bases.push(
        createWikidataKnowledgeBase({
          sameAsTypeMap: wd.sameAsTypeMap,
        }),
      );
    }
    return bases;
  }, [
    dataStore,
    normDataMapping,
    queryBuildOptions.primaryFields,
    queryBuildOptions.typeIRItoTypeName,
  ]);
  return <EntityFinder {...props} allKnowledgeBases={allKnowledgeBases} />;
};
