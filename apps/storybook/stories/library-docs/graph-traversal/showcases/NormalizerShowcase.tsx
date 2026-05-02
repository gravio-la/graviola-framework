// @ts-nocheck
import React, { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import type { GraphTraversalFilterOptions } from "@graviola/edb-core-types";
import { Grid, Typography } from "@mui/material";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

export interface NormalizerShowcaseProps {
  schema: JSONSchema7;
  includeFriends: boolean;
  friendsLimit: number;
  maxRecursion: number;
  omitFields?: string[];
}

export const NormalizerShowcase: React.FC<NormalizerShowcaseProps> = ({
  schema,
  includeFriends,
  friendsLimit,
  maxRecursion,
  omitFields = [],
}) => {
  const normalized = useMemo(() => {
    try {
      const filterOptions: GraphTraversalFilterOptions = {
        maxRecursion,
      };

      if (includeFriends) {
        filterOptions.include = {
          friends: {
            take: friendsLimit,
            orderBy: { name: "asc" },
          },
        };
      }

      if (omitFields.length > 0) {
        filterOptions.omit = omitFields;
      }

      return normalizeSchema(schema, filterOptions);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [schema, includeFriends, friendsLimit, maxRecursion, omitFields]);

  return (
    <Grid container direction="row" wrap="nowrap" justifyContent="center">
      <Grid item flex={1} sx={{ maxHeight: "70vh", overflow: "auto" }}>
        <Typography variant="h5">Input Schema</Typography>
        <JsonView data={schema} shouldExpandNode={(lvl) => lvl < 3} />
      </Grid>
      <Grid item flex={1} sx={{ maxHeight: "70vh", overflow: "auto" }}>
        <Typography variant="h5">Normalized Schema</Typography>
        <JsonView data={normalized} shouldExpandNode={(lvl) => lvl < 2} />
      </Grid>
    </Grid>
  );
};
