import { SemanticCard } from "@graviola/semantic-views";
import { useEntity } from "@graviola/edb-state-hooks";
import { Box } from "@mui/material";

import type { EntityEmbedRendererProps } from "../types";

export function CardEntityRefView({
  entityIRI,
  typeIRI,
}: EntityEmbedRendererProps) {
  const { loadQuery } = useEntity({
    entityIRI: entityIRI!,
    typeIRI,
    disableLoad: !entityIRI,
  });
  const document = loadQuery.data?.document ?? loadQuery.data;

  if (!entityIRI) {
    return null;
  }

  return (
    <Box sx={{ my: 1, maxWidth: 480 }}>
      <SemanticCard
        entityIRI={entityIRI}
        typeIRI={typeIRI}
        defaultData={document}
      />
    </Box>
  );
}
