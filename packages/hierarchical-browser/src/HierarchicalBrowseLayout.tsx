import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export type HierarchicalBrowseLayoutProps = {
  /** Left tree panel content. */
  tree: ReactNode;
  /** Main content (list / table / detail). */
  children: ReactNode;
  /** Optional top toolbar spanning both columns (breadcrumb, toggles, …). */
  toolbar?: ReactNode;
  /** Tree panel width in px (default 300). */
  treeWidth?: number;
  className?: string;
};

/**
 * Full-height flex browse chrome: optional toolbar, left tree (~300px), right content.
 */
export function HierarchicalBrowseLayout({
  tree,
  children,
  toolbar,
  treeWidth = 300,
  className,
}: HierarchicalBrowseLayoutProps) {
  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        width: "100%",
      }}
    >
      {toolbar != null ? (
        <Box
          sx={{
            flexShrink: 0,
            borderBottom: 1,
            borderColor: "divider",
            px: 1,
            py: 0.5,
          }}
        >
          {toolbar}
        </Box>
      ) : null}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <Box
          component="aside"
          sx={{
            width: treeWidth,
            flexShrink: 0,
            overflow: "auto",
            borderRight: 1,
            borderColor: "divider",
            py: 0.5,
          }}
        >
          {tree}
        </Box>
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
