import { SemanticCard } from "@graviola/semantic-views";
import {
  MODAL_ENTITY_DETAIL,
  useGraviolaModal,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import { Box, Popper, type SxProps, type Theme } from "@mui/material";
import { MouseEvent, ReactNode, useCallback, useState } from "react";

export type EntityDetailElementProps = {
  entityIRI: string;
  typeIRI?: string;
  data?: unknown;
  disableLoad?: boolean;
  compactPreview?: boolean;
  /** @deprecated Passed through to the outer wrapper only. */
  sx?: SxProps<Theme>;
  /** @deprecated Ignored; preserved for call-site compatibility. */
  cardActionChildren?: ReactNode | null;
  /** @deprecated Ignored; preserved for call-site compatibility. */
  readonly?: boolean;
};

export const EntityDetailElement = ({
  entityIRI,
  typeIRI,
  data,
  disableLoad,
  compactPreview,
  sx,
}: EntityDetailElementProps) => {
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);
  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      detailModal.show({ entityIRI, typeIRI: classIRI, data });
    },
    [entityIRI, classIRI, data, detailModal],
  );

  return (
    <Box
      sx={sx}
      onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
      onMouseLeave={() => setAnchorEl(null)}
    >
      <SemanticCard
        entityIRI={entityIRI}
        typeIRI={classIRI}
        defaultData={data}
        disableLoad={disableLoad}
        variant={compactPreview ? "compact" : "default"}
        onClick={showDetailModal}
      />
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="right-start"
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ width: 320, p: 1 }}>
          <SemanticCard
            entityIRI={entityIRI}
            typeIRI={classIRI}
            defaultData={data}
            disableLoad={disableLoad}
          />
        </Box>
      </Popper>
    </Box>
  );
};
