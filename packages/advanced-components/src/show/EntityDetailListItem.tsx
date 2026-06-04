import { SemanticListItem } from "@graviola/semantic-views";
import {
  MODAL_ENTITY_DETAIL,
  useGraviolaModal,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, IconButton, ListItemButton } from "@mui/material";
import { MouseEvent, useCallback } from "react";

export type EntityDetailListItemProps = {
  entityIRI: string;
  typeIRI?: string;
  data?: any;
  disableLoad?: boolean;
  onClick?: (e: MouseEvent) => void;
  /** When a function, shows a clear control (linked-data form pickers pass `enabled && handleClear`). */
  onClear?: false | (() => void);
};

export const EntityDetailListItem = ({
  entityIRI,
  typeIRI,
  data,
  disableLoad,
  onClick,
  onClear,
}: EntityDetailListItemProps) => {
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      detailModal.show({ entityIRI, typeIRI: classIRI, data });
    },
    [entityIRI, classIRI, data, detailModal],
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
      <ListItemButton
        onClick={onClick ?? showDetailModal}
        sx={{ flex: 1, px: 0 }}
      >
        <SemanticListItem
          entityIRI={entityIRI}
          typeIRI={classIRI}
          defaultData={data}
          disableLoad={disableLoad}
        />
      </ListItemButton>
      {typeof onClear === "function" ? (
        <IconButton
          size="small"
          aria-label="clear"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Box>
  );
};
