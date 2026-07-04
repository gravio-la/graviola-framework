import React, { useCallback } from "react";
import { Button } from "@mui/material";
import type { CardActionDef } from "@graviola/edb-core-types";
import type { CardActionRendererProps } from "@graviola/edb-detail-renderer-core";

type DefaultActionButtonProps = CardActionRendererProps & {
  onShowEdit?: (intent: "show" | "edit") => void;
  onCustom?: () => void;
};

/** Default pill button for card actions without a custom renderer. */
export function DefaultActionButton({
  action,
  onShowEdit,
  onCustom,
}: DefaultActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action.intent === "show" || action.intent === "edit") {
      onShowEdit?.(action.intent);
      return;
    }
    onCustom?.();
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
