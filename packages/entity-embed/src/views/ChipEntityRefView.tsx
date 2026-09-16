import {
  MODAL_ENTITY_DETAIL,
  useAdbContext,
  useEntity,
  useEntityPreview,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";
import { Chip } from "@mui/material";
import { useCallback, type MouseEvent } from "react";

import type { EntityEmbedRendererProps } from "../types";

export function ChipEntityRefView({
  entityIRI,
  typeIRI,
  typeName,
  label,
  ref: entityRef,
}: EntityEmbedRendererProps) {
  const adb = useAdbContext();
  const resolvedTypeIRI =
    typeIRI ?? (typeName ? adb.typeNameToTypeIRI(typeName) : undefined);
  const { loadQuery } = useEntity({
    entityIRI: entityIRI!,
    typeIRI: resolvedTypeIRI,
    disableLoad: !entityIRI,
  });
  const document = loadQuery.data?.document ?? loadQuery.data;
  const preview = useEntityPreview(document, {
    typeName,
    typeIRI: resolvedTypeIRI,
  });
  const text = preview.label ?? label ?? entityRef.entityId ?? entityIRI;
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const onClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (!entityIRI) return;
      detailModal.show({
        entityIRI,
        typeIRI: resolvedTypeIRI,
        data: document,
      });
    },
    [entityIRI, resolvedTypeIRI, document, detailModal],
  );

  return (
    <Chip
      component="span"
      size="small"
      label={text}
      onClick={onClick}
      sx={{ verticalAlign: "middle", mx: 0.25 }}
    />
  );
}
