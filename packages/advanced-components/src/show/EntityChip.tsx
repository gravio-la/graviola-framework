import { SemanticChip } from "@graviola/semantic-views";
import {
  MODAL_ENTITY_DETAIL,
  useGraviolaModal,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import type { ChipProps } from "@mui/material";
import { MouseEvent, useCallback } from "react";

export type EntityChipProps = {
  index?: number;
  disableLoad?: boolean;
  entityIRI: string;
  typeIRI?: string;
  data?: any;
} & ChipProps;

export const EntityChip = ({
  disableLoad,
  entityIRI,
  typeIRI,
  data: defaultData,
  onClick,
  ...chipProps
}: EntityChipProps) => {
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      detailModal.show(
        { entityIRI, typeIRI: classIRI, data: defaultData },
        { origin: { source: "advanced-components:EntityChip" } },
      );
    },
    [entityIRI, classIRI, defaultData, detailModal],
  );

  return (
    <SemanticChip
      entityIRI={entityIRI}
      typeIRI={classIRI}
      defaultData={defaultData}
      disableLoad={disableLoad}
      onClick={onClick ?? showDetailModal}
      {...chipProps}
    />
  );
};
