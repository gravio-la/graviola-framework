import React from "react";
import { Button } from "@mui/material";
import type { EntityActionRendererProps } from "@graviola/edb-detail-renderer-core";

type DefaultActionButtonProps = EntityActionRendererProps & {
  onAction?: () => void;
};

/** Default pill button for entity actions without a custom renderer. */
export function DefaultActionButton({
  action,
  onAction,
}: DefaultActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.();
  };

  return (
    <Button
      size="small"
      variant={action.primary ? "contained" : "text"}
      color={action.primary ? "primary" : "inherit"}
      onClick={handleClick}
      sx={{
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 600,
        ...(action.primary ? { px: 2.5 } : { color: "text.secondary" }),
      }}
    >
      {action.icon ? `${action.icon} ` : null}
      {action.label}
    </Button>
  );
}
