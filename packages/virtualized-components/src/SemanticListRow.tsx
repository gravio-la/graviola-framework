import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import type { JsonLdEntity } from "@graviola/edb-state-hooks";
import { SemanticListItemNoOps } from "@graviola/semantic-views";
import { Box } from "@mui/material";
import type { ListTypeMode } from "./listTypes";
import { entityIri, entityTypeIri } from "./useDefaultOpenDetail";

export type SemanticListRowProps<T extends JsonLdEntity = JsonLdEntity> = {
  doc: T;
  typeMode: ListTypeMode;
  config?: Partial<DetailViewConfig>;
  onOpenDetail: (doc: T) => void;
};

export function SemanticListRow<T extends JsonLdEntity = JsonLdEntity>({
  doc,
  typeMode,
  config,
  onOpenDetail,
}: SemanticListRowProps<T>) {
  const iri = entityIri(doc);
  const knownTypeName =
    typeMode.kind === "known" ? typeMode.typeName : undefined;
  const knownTypeIRI = typeMode.kind === "known" ? typeMode.typeIRI : undefined;
  const detectedTypeIRI =
    typeMode.kind === "detect" ? entityTypeIri(doc) : undefined;

  return (
    <Box
      onClick={() => onOpenDetail(doc)}
      sx={{
        cursor: "pointer",
        borderBottom: 1,
        borderColor: "divider",
        "&:hover": { bgcolor: "action.hover" },
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <SemanticListItemNoOps
        data={doc}
        entityIRI={iri}
        typeName={knownTypeName}
        typeIRI={knownTypeIRI ?? detectedTypeIRI}
        motionId={iri}
        config={config}
      />
    </Box>
  );
}
