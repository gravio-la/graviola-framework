import { SemanticCard } from "@graviola/semantic-views";
import {
  MODAL_ENTITY_DETAIL,
  useEntity,
  useEntityPreview,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";
import { Box, Link, Popper } from "@mui/material";
import { useCallback, useState, type MouseEvent } from "react";

import type { EntityEmbedRendererProps } from "../types";

/** Wikipedia-style inline link with hover preview popover. */
export function InlineEntityRefView({
  entityIRI,
  typeIRI,
  typeName,
  label,
  ref: entityRef,
}: EntityEmbedRendererProps) {
  const { loadQuery } = useEntity({
    entityIRI: entityIRI!,
    typeIRI,
    disableLoad: !entityIRI,
  });
  const document = loadQuery.data?.document ?? loadQuery.data;
  const preview = useEntityPreview(document, { typeName, typeIRI });
  const text = preview.label ?? label ?? entityRef.entityId ?? entityIRI;
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (!entityIRI) return;
      detailModal.show({ entityIRI, typeIRI, data: document });
    },
    [entityIRI, typeIRI, document, detailModal],
  );

  if (!entityIRI) {
    return <span>{text}</span>;
  }

  return (
    <Box
      component="span"
      sx={{ display: "inline" }}
      onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
      onMouseLeave={() => setAnchorEl(null)}
    >
      <Link
        component="span"
        underline="hover"
        sx={{ cursor: "pointer" }}
        onClick={showDetailModal}
      >
        {text}
      </Link>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="right-start"
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ width: 320, p: 1 }}>
          <SemanticCard
            entityIRI={entityIRI}
            typeIRI={typeIRI}
            defaultData={document}
            variant="compact"
          />
        </Box>
      </Popper>
    </Box>
  );
}
