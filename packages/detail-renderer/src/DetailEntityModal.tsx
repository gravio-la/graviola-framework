import NiceModal, { useModal } from "@ebay/nice-modal-react";
import type { UISchemaElement } from "@jsonforms/core";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import {
  MODAL_EDIT_ENTITY,
  useAdbContext,
  useCRUDWithQueryClient,
  useDispatchIntent,
  useGraviolaModal,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import type { EntityDetailModalProps } from "@graviola/semantic-jsonform-types";
import { queryOptionMixinBasedOnEntity } from "@graviola/edb-ui-utils";
import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { JSONSchema7 } from "json-schema";
import type { ComponentType } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DetailRenderer } from "./DetailRenderer";

/**
 * When set, detail `Dialog` instances use `container` so their Modal roots render under that node
 * (advanced stacking / embedding).
 */
export const DetailEntityModalPortalContext = createContext<HTMLElement | null>(
  null,
);

export function useDetailEntityModalPortalContainer(): HTMLElement | null {
  return useContext(DetailEntityModalPortalContext);
}

/** Extra controls in the detail dialog header (e.g. share); receives resolved entity + class IRIs. */
export type DetailEntityModalHeaderActionsProps = {
  entityIRI: string;
  typeIRI: string;
};

export type DetailEntityModalStaticConfig = {
  detailViewConfig?: Partial<DetailViewConfig>;
  detailUiSchemata?: Record<string, UISchemaElement>;
  typeNameLabelMap?: Record<string, string>;
  headerActionsSlot?: ComponentType<DetailEntityModalHeaderActionsProps>;
  /**
   * When true, the header edit control is omitted regardless of {@link EntityDetailModalProps.readonly}
   * (e.g. read-only / map-first apps that still use `peek: false` for full layout).
   */
  hideEditButton?: boolean;
};

function mergedDetailRendererConfig(
  staticCfg: DetailEntityModalStaticConfig | undefined,
): Partial<DetailViewConfig> | undefined {
  if (!staticCfg?.detailViewConfig && !staticCfg?.detailUiSchemata) {
    return undefined;
  }
  const uiSchemata = {
    ...(staticCfg.detailViewConfig?.uiSchemata ?? {}),
    ...(staticCfg.detailUiSchemata ?? {}),
  };
  const hasMergedUiSchemata = Object.keys(uiSchemata).length > 0;
  return {
    ...staticCfg.detailViewConfig,
    ...(hasMergedUiSchemata ? { uiSchemata } : {}),
  };
}

const LoadingDetailDialog: ComponentType<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  const portalEl = useDetailEntityModalPortalContainer();
  const containerProp =
    portalEl !== null ? { container: (): HTMLElement => portalEl } : {};
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      {...containerProp}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          py: 4,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

function detailDialogPaperProps(theme: Theme, fullScreen: boolean) {
  return {
    elevation: 8 as const,
    sx: {
      borderRadius: 2,
      maxWidth: theme.breakpoints.values.md,
      width: `min(96vw, ${theme.breakpoints.values.md}px)`,
      maxHeight: "92vh",
      m: "auto",
      overflow: "hidden",
      bgcolor: theme.palette.background.paper,
      backgroundImage: "none",
      position: "relative" as const,
      ...(fullScreen
        ? {
            height: "100%",
            maxHeight: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }
        : {}),
    },
  };
}

function DetailModalBody({
  classIRI,
  entityIRI,
  typeName,
  rootSchema,
  data,
  staticConfig,
  humanLabelFallback,
  handleEdit,
  handleClose,
  readonly,
  disableInlineEditing,
}: {
  classIRI: string;
  entityIRI: string;
  typeName: string;
  rootSchema: JSONSchema7 | undefined;
  data: Record<string, unknown>;
  staticConfig: DetailEntityModalStaticConfig | undefined;
  humanLabelFallback: string;
  handleEdit: () => void;
  handleClose: () => void;
  readonly?: boolean;
  disableInlineEditing?: boolean;
}) {
  const theme = useTheme();
  const portalEl = useDetailEntityModalPortalContainer();
  const containerProp =
    portalEl !== null ? { container: (): HTMLElement => portalEl } : {};
  const fullScreenMdDown = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  const typeSchema = useMemo<JSONSchema7 | undefined>(() => {
    if (!rootSchema) return undefined;
    return bringDefinitionToTop(rootSchema as never, typeName) as JSONSchema7;
  }, [rootSchema, typeName]);

  const overlayConfig = useMemo(
    () => mergedDetailRendererConfig(staticConfig),
    [staticConfig],
  );

  const humanLabel =
    staticConfig?.typeNameLabelMap?.[typeName] ?? humanLabelFallback;

  const HeaderActionsSlot = staticConfig?.headerActionsSlot;
  const showEditButton = !readonly && !staticConfig?.hideEditButton;

  if (!typeSchema) {
    return (
      <Dialog
        open
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        {...containerProp}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogContent sx={{ pt: 2 }}>
          <Typography color="text.secondary">
            {t("no schema for type")}
          </Typography>
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 2 }}>
          <Button onClick={handleClose} variant="contained">
            {t("close")}
          </Button>
        </Box>
      </Dialog>
    );
  }

  const paperSlot = detailDialogPaperProps(theme, fullScreenMdDown);
  const dialogContainerPadding = fullScreenMdDown ? undefined : { p: 1.5 };

  const solidIconButtonSx = {
    bgcolor: "action.hover",
    "&:hover": { bgcolor: "action.selected" },
  } as const;

  const headerActions = (
    <>
      {HeaderActionsSlot ? (
        <HeaderActionsSlot entityIRI={entityIRI} typeIRI={classIRI} />
      ) : null}
      {showEditButton && (
        <IconButton
          size="medium"
          onClick={handleEdit}
          color="inherit"
          aria-label={disableInlineEditing ? t("edit") : t("edit inline")}
          sx={solidIconButtonSx}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      <IconButton
        size="medium"
        onClick={handleClose}
        color="inherit"
        aria-label={t("close")}
        sx={solidIconButtonSx}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  );

  const body = (
    <Box sx={{ position: "relative", minHeight: 48 }}>
      <Box
        sx={{
          position: "absolute",
          top: theme.spacing(0),
          right: theme.spacing(0),
          zIndex: 2,
          display: "flex",
          gap: 0.25,
          flexDirection: "row",
        }}
      >
        {headerActions}
      </Box>
      <DetailRenderer
        schema={typeSchema}
        data={data}
        typeIRI={classIRI}
        typeName={typeName}
        entityIRI={entityIRI}
        humanLabel={humanLabel}
        generateUISchema
        config={overlayConfig ?? {}}
      />
    </Box>
  );

  return (
    <Dialog
      open
      onClose={handleClose}
      scroll="paper"
      fullScreen={fullScreenMdDown}
      disableEnforceFocus
      {...containerProp}
      sx={{
        "& .MuiDialog-container": dialogContainerPadding,
      }}
      slotProps={{
        paper: paperSlot,
      }}
    >
      <DialogContent
        sx={{
          p: 2,
          overflow: "auto",
          ...(fullScreenMdDown ? { flex: 1, minHeight: 0 } : {}),
          "&:first-of-type": {
            pt: 2,
          },
        }}
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}

function DetailEntityDataWrapper({
  classIRI,
  entityIRI,
  typeIRI,
  typeName,
  defaultData,
  readonly,
  disableInlineEditing,
  staticConfig,
  onClose,
}: {
  classIRI: string;
  entityIRI: string;
  typeIRI: string;
  typeName: string;
  defaultData?: unknown;
  readonly?: boolean;
  disableInlineEditing?: boolean;
  staticConfig: DetailEntityModalStaticConfig | undefined;
  onClose: () => void;
}) {
  const { schema: rootSchema } = useAdbContext();
  const dispatchIntent = useDispatchIntent();
  const { t } = useTranslation();

  const {
    loadQuery: { data: rawData },
  } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI: classIRI,
    queryOptions: {
      enabled: true,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(defaultData),
    },
    loadQueryKey: "show",
  });

  const data = (rawData?.document ?? defaultData) as
    | Record<string, unknown>
    | undefined;

  const editModal = useGraviolaModal(MODAL_EDIT_ENTITY);
  const handleEdit = useCallback(() => {
    if (!disableInlineEditing) {
      editModal.show(
        {
          entityIRI,
          typeIRI,
          data,
          disableLoad: true,
        },
        {
          origin: {
            source: "edb-detail-renderer:DetailEntityModal:inline-edit",
          },
        },
      );
    } else {
      dispatchIntent({
        kind: "edit-entity",
        typeName,
        entityIRI,
        origin: { source: "edb-detail-renderer:DetailEntityModal:route-edit" },
      });
    }
  }, [
    data,
    disableInlineEditing,
    dispatchIntent,
    entityIRI,
    editModal,
    typeIRI,
    typeName,
  ]);

  if (!data) {
    return (
      <LoadingDetailDialog message={t("loading entity")} onClose={onClose} />
    );
  }

  return (
    <DetailModalBody
      classIRI={classIRI}
      entityIRI={entityIRI}
      typeName={typeName}
      rootSchema={rootSchema as JSONSchema7 | undefined}
      data={data}
      staticConfig={staticConfig}
      humanLabelFallback={typeName}
      handleEdit={handleEdit}
      handleClose={onClose}
      readonly={readonly}
      disableInlineEditing={disableInlineEditing}
    />
  );
}

function DetailEntityClassWrapper({
  typeIRI,
  entityIRI,
  defaultData,
  readonly,
  disableInlineEditing,
  staticConfig,
  onClose,
}: {
  typeIRI: string;
  entityIRI: string;
  defaultData?: unknown;
  readonly?: boolean;
  disableInlineEditing?: boolean;
  staticConfig: DetailEntityModalStaticConfig | undefined;
  onClose: () => void;
}) {
  const { typeIRIToTypeName } = useAdbContext();
  const { t } = useTranslation();

  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, false);

  if (!classIRI) {
    return (
      <LoadingDetailDialog
        message={t("loading type information")}
        onClose={onClose}
      />
    );
  }

  const typeName = typeIRIToTypeName(classIRI);

  return (
    <DetailEntityDataWrapper
      classIRI={classIRI}
      entityIRI={entityIRI}
      typeIRI={typeIRI}
      typeName={typeName}
      defaultData={defaultData}
      readonly={readonly}
      disableInlineEditing={disableInlineEditing}
      staticConfig={staticConfig}
      onClose={onClose}
    />
  );
}

export type DetailEntityModalViewProps = EntityDetailModalProps & {
  staticConfig?: DetailEntityModalStaticConfig;
};

/**
 * Detail-modal body without outer {@link NiceModal.register}. Use when the app owns the modal shell.
 */
export function DetailEntityModalView({
  staticConfig,
  typeIRI,
  entityIRI,
  data: defaultData,
  readonly,
  disableInlineEditing,
  onClose,
}: DetailEntityModalViewProps) {
  const handleClose = onClose ?? (() => undefined);

  return (
    <DetailEntityClassWrapper
      typeIRI={typeIRI ?? ""}
      entityIRI={entityIRI}
      defaultData={defaultData}
      readonly={readonly}
      disableInlineEditing={disableInlineEditing}
      staticConfig={staticConfig}
      onClose={handleClose}
    />
  );
}

/**
 * Same NiceModal id contract as EntityDetailModal ({@link MODAL_ENTITY_DETAIL}).
 *
 * Provide `staticConfig` from app {@link SchemaConfig} maps so callers need not repeat them per `NiceModal.show`.
 */
export function createDetailEntityModal(
  staticConfig?: DetailEntityModalStaticConfig,
): ComponentType<EntityDetailModalProps> {
  return NiceModal.create(
    ({
      typeIRI,
      entityIRI,
      data: defaultData,
      readonly,
      disableInlineEditing,
      onClose: onCloseFromProps,
    }: EntityDetailModalProps) => {
      const modal = useModal();

      const handleClose = useCallback(() => {
        if (onCloseFromProps) {
          onCloseFromProps();
        } else {
          modal.remove();
        }
      }, [modal, onCloseFromProps]);

      if (!modal.visible) return null;

      return (
        <DetailEntityModalView
          typeIRI={typeIRI}
          entityIRI={entityIRI}
          data={defaultData}
          readonly={readonly}
          disableInlineEditing={disableInlineEditing}
          onClose={handleClose}
          staticConfig={staticConfig}
        />
      );
    },
  );
}

export const DetailEntityModal = createDetailEntityModal();
