import { Button } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { flattenMetaSchemaProfile } from "@graviola/meta-schema";
import type { JSONSchema7 } from "json-schema";
import { calcDebug } from "../demo/calcDebug";
import { demoEntityMeta } from "../demo/demoProvenance";
import { showSchemaDrivenDetail } from "../modals/SchemaDrivenDetailModal";

export function EntityMetaAffordances({
  document,
  metaSchema,
}: {
  document: Record<string, unknown>;
  metaSchema: JSONSchema7;
}) {
  const open = () => {
    const meta =
      (document.$meta as Record<string, unknown> | undefined) ??
      demoEntityMeta(document);
    calcDebug("open entity $meta", meta);
    void showSchemaDrivenDetail({
      title: "Entity metadata ($meta)",
      data: meta,
      schema: flattenMetaSchemaProfile(metaSchema),
    });
  };

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<InfoOutlinedIcon />}
      onClick={open}
      sx={{ mb: 2 }}
    >
      Entity metadata
    </Button>
  );
}
