import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  AppBar,
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import { generateDefaultDetailUISchema } from "@graviola/edb-detail-renderer";
import { SemanticDetailViewNoOps } from "@graviola/semantic-views";
import type { UISchemaElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { useMemo } from "react";

export type SchemaDrivenDetailModalProps = {
  title: string;
  data: unknown;
  schema: JSONSchema7;
  uiSchema?: UISchemaElement;
  config?: Partial<DetailViewConfig>;
};

/**
 * Demo modal that renders arbitrary JSON through the same DetailRenderer
 * structural-dispatch stack as entity detail pages.
 */
export const SchemaDrivenDetailModal = NiceModal.create(
  ({ title, data, schema, uiSchema, config }: SchemaDrivenDetailModalProps) => {
    const modal = useModal();
    const resolvedUi = useMemo(
      () =>
        uiSchema ??
        generateDefaultDetailUISchema(schema as never, {
          layoutType: "VerticalLayout",
        }),
      [schema, uiSchema],
    );

    return (
      <Dialog
        open={modal.visible}
        onClose={() => modal.remove()}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <IconButton
              edge="end"
              aria-label="close"
              onClick={() => modal.remove()}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <SemanticDetailViewNoOps
              data={data}
              schema={schema}
              uiSchema={resolvedUi}
              config={config}
            />
          </Box>
        </DialogContent>
      </Dialog>
    );
  },
);

export function showSchemaDrivenDetail(props: SchemaDrivenDetailModalProps) {
  return NiceModal.show(SchemaDrivenDetailModal, props);
}
