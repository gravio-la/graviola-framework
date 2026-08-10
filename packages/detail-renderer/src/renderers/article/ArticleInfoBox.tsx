import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import type { ControlElement } from "@jsonforms/core";
import { camelCaseToTitleCase } from "@graviola/edb-core-utils";
import type {
  DetailDispatch,
  DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";
import { pathFromScope } from "@graviola/edb-detail-renderer-core";

import {
  ARTICLE_INFO_LABEL_SX,
  ARTICLE_INFO_LABEL_VARIANT,
  ARTICLE_INFO_VALUE_VARIANT,
} from "./articleTypography";

export type ArticleInfoBoxProps = {
  controls: ControlElement[];
  dispatch: DetailDispatch;
  ctx: DetailTesterContext;
  /** `"aside"` floats right; `"block"` is full-width. */
  placement?: "aside" | "block";
  width?: string;
};

/**
 * Definition-list style info box for literal properties.
 * Owns label typography; dispatches each control with `label: ""` so PropertyRow
 * collapses to a single column.
 */
export function ArticleInfoBox({
  controls,
  dispatch,
  ctx,
  placement = "aside",
  width = "16rem",
}: ArticleInfoBoxProps) {
  if (controls.length === 0) return null;

  const box = (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        bgcolor: "action.hover",
        ...(placement === "aside"
          ? {
              width: { xs: "100%", sm: width },
              float: { sm: "right" },
              ml: { sm: 2 },
              mb: 2,
              clear: { sm: "right" },
            }
          : { width: "100%", mb: 2 }),
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {controls.map((control, i) => {
          const path = pathFromScope(control.scope ?? "#");
          const propName = path[path.length - 1] ?? "";
          const label =
            (typeof control.label === "string" && control.label) ||
            camelCaseToTitleCase(propName);
          const blankLabelControl: ControlElement = {
            ...control,
            label: "",
          };
          const value = dispatch({ uiSchema: blankLabelControl, ctx });
          // Skip rows hidden by config (e.g. header primary fields like `name`).
          if (value == null) return null;
          return (
            <Box key={control.scope ?? i}>
              <Typography
                variant={ARTICLE_INFO_LABEL_VARIANT}
                sx={ARTICLE_INFO_LABEL_SX}
              >
                {label}
              </Typography>
              <Box
                sx={{
                  "& .MuiTypography-root": {
                    fontSize: (theme) =>
                      theme.typography[ARTICLE_INFO_VALUE_VARIANT].fontSize,
                  },
                }}
              >
                {value}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );

  return box;
}
