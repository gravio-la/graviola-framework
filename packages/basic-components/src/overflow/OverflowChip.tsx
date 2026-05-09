import { useState, MouseEvent, useCallback } from "react";
import { Chip, Tooltip } from "@mui/material";
import {
  MODAL_ENTITY_DETAIL,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";

export type OverflowChipProps = {
  label: React.ReactNode;
  secondary?: React.ReactNode;
  entityIRI?: string;
};

export const OverflowChip = ({
  label,
  entityIRI,
  secondary,
}: OverflowChipProps) => {
  const [tooltipEnabled, setTooltipEnabled] = useState(false);
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      if (!entityIRI) return;
      e.preventDefault();
      detailModal.show(
        { entityIRI },
        { origin: { source: "basic-components:OverflowChip" } },
      );
    },
    [entityIRI, detailModal],
  );

  const handleShouldShow = useCallback(
    (e: MouseEvent<Element>) => {
      setTooltipEnabled(true);
    },
    [setTooltipEnabled],
  );

  return (
    <Tooltip
      title={secondary || label}
      open={tooltipEnabled}
      onClose={() => setTooltipEnabled(false)}
    >
      <Chip
        size={"small"}
        onMouseEnter={handleShouldShow}
        sx={{ maxWidth: "8em" }}
        label={label}
        onClick={showDetailModal}
      />
    </Tooltip>
  );
};
