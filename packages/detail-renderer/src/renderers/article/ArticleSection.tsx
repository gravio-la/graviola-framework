import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import { articleHeadingProps } from "./articleTypography";

export type ArticleSectionProps = {
  label: ReactNode;
  headingLevel: number;
  /** Right of the heading — statement badges, counts. */
  adornment?: ReactNode;
  children: ReactNode;
};

/** Headed article section — flat body, no indent rule, no caret. */
export function ArticleSection({
  label,
  headingLevel,
  adornment,
  children,
}: ArticleSectionProps) {
  const headingProps = articleHeadingProps(headingLevel);
  const headerLabel =
    typeof label === "string" ? (
      <Typography {...headingProps}>{label}</Typography>
    ) : (
      label
    );

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          mb: 0.75,
        }}
      >
        {headerLabel}
        {adornment}
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}
