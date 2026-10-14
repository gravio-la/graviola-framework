import React, { useMemo } from "react";
import type { MarkdownPreviewProps } from "@uiw/react-markdown-preview";
import type { ValueRendererProps } from "@graviola/edb-detail-renderer-core";
import { MDEditorMarkdown } from "@graviola/edb-markdown-renderer";
import { Box, useTheme } from "@mui/material";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";

export function MarkdownValueRenderer({ value }: ValueRendererProps) {
  const theme = useTheme();
  if (value == null || value === "") return null;
  const source = String(value);

  const rehypePlugins = useMemo(
    () => [
      rehypeSanitize,
      [
        rehypeExternalLinks,
        { target: "_blank", rel: ["noopener", "noreferrer"] },
      ],
    ],
    [],
  );

  return (
    <Box
      className="graviola-detail-markdown"
      data-color-mode={theme.palette.mode}
      sx={{
        color: "inherit",
        "& .wmde-markdown": {
          color: "inherit",
          fontSize: "inherit",
          background: "transparent",
          bgcolor: "transparent",
        },
        "& p": { margin: 0, "& + p": { mt: 0.75 } },
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      <MDEditorMarkdown
        source={source}
        rehypePlugins={rehypePlugins as MarkdownPreviewProps["rehypePlugins"]}
      />
    </Box>
  );
}
