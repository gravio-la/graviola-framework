import NiceModal, { useModal } from "@ebay/nice-modal-react";
import type { UISchemaElement } from "@jsonforms/core";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { EditEntityModal } from "@graviola/edb-advanced-components";
import {
  GRAVIOLA_HISTORY_MODAL_ATTR,
  GraviolaNiceModalStackIdProvider,
  useAdbContext,
  useCRUDWithQueryClient,
  useDispatchIntent,
  useGraviolaNiceModalStackId,
  useModalRegistry,
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
import { alpha, type Theme } from "@mui/material/styles";
import type { JSONSchema7 } from "json-schema";
import type { ComponentType } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DetailRenderer } from "./DetailRenderer";

/**
 * When set, detail `Dialog` instances use `container` so their Modal roots render under that node
 * (advanced stacking / embedding). Swipe translations should use {@link DetailEntityModalPaperGestureContext}
 * so the backdrop stays fixed.
 */
export const DetailEntityModalPortalContext = createContext<HTMLElement | null>(
  null,
);

export function useDetailEntityModalPortalContainer(): HTMLElement | null {
  return useContext(DetailEntityModalPortalContext);
}

/** Horizontal swipe offset applied to dialog Paper only (backdrop stays fixed). */
export type DetailEntityModalPaperGesture = {
  offsetPx: number;
  transitionMs: number;
};

export const DetailEntityModalPaperGestureContext =
  createContext<DetailEntityModalPaperGesture | null>(null);

export function detailEntityModalPaperGestureSx(
  gesture: DetailEntityModalPaperGesture | null,
): Record<string, unknown> | undefined {
  if (!gesture) return undefined;
  return {
    transform: `translateX(${gesture.offsetPx}px)`,
    transition:
      gesture.transitionMs > 0
        ? `transform ${gesture.transitionMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        : "none",
    willChange: "transform",
  };
}

/** Extra controls in the detail dialog header (e.g. share); receives resolved entity + class IRIs. */
export type DetailEntityModalHeaderActionsProps = {
  entityIRI: string;
  typeIRI: string;
};

/** Presentation options for the detail dialog shell (opt-in; defaults preserve legacy layout). */
export type DetailEntityModalPresentation = {
  /**
   * When true, bookmark/share/edit/close stay at the top of the scroll view as small glass
   * controls (no full-width bar); they overlap the hero image initially.
   */
  stickyHeaderActions?: boolean;
  /**
   * When true, the dialog paper is visually minimal (transparent, no shadow) so inner layout/cards
   * read as the primary surface.
   */
  cardOnly?: boolean;
};

export type DetailEntityModalStaticConfig = {
  detailViewConfig?: Partial<DetailViewConfig>;
  detailUiSchemata?: Record<string, UISchemaElement>;
  typeNameLabelMap?: Record<string, string>;
  headerActionsSlot?: ComponentType<DetailEntityModalHeaderActionsProps>;
  modalPresentation?: DetailEntityModalPresentation;
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
  const stackId = useGraviolaNiceModalStackId();
  const portalEl = useDetailEntityModalPortalContainer();
  const paperGesture = useContext(DetailEntityModalPaperGestureContext);
  const gestureSx = detailEntityModalPaperGestureSx(paperGesture);
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
            ...(gestureSx ?? {}),
          },
        },
        ...(stackId
          ? { root: { [GRAVIOLA_HISTORY_MODAL_ATTR]: stackId } as never }
          : {}),
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

/** Card-shaped dialog paper (elevated panel, rounded), or minimal shell when `cardOnly`. */
function detailDialogPaperProps(
  theme: Theme,
  options?: { cardOnly?: boolean },
) {
  if (options?.cardOnly) {
    return {
      elevation: 0 as const,
      sx: {
        borderRadius: 2,
        maxWidth: theme.breakpoints.values.md,
        width: `min(96vw, ${theme.breakpoints.values.md}px)`,
        maxHeight: "92vh",
        m: "auto",
        overflow: "hidden",
        bgcolor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
        position: "relative" as const,
        /** Clicks on transparent shell pass through to MUI Backdrop so `onClose` runs. */
        pointerEvents: "none",
      },
    };
  }
  return {
    elevation: 8,
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
    },
  };
}

/** Frosted icon buttons for use over hero imagery (sticky header actions mode). Matches KLP glass controls. */
function glassIconButtonSx(theme: Theme) {
  const w = theme.palette.common.white;
  return {
    bgcolor: alpha(w, 0.22),
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: `1px solid ${alpha(w, 0.35)}`,
    color: "grey.900",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
    "&:hover": {
      bgcolor: alpha(w, 0.34),
    },
    "&.Mui-disabled": {
      bgcolor: alpha(w, 0.12),
      color: "grey.600",
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
  const stackId = useGraviolaNiceModalStackId();
  const historyRootSlot = stackId
    ? { root: { [GRAVIOLA_HISTORY_MODAL_ATTR]: stackId } }
    : {};
  const portalEl = useDetailEntityModalPortalContainer();
  const containerProp =
    portalEl !== null ? { container: (): HTMLElement => portalEl } : {};
  const paperGesture = useContext(DetailEntityModalPaperGestureContext);
  const gestureSx = detailEntityModalPaperGestureSx(paperGesture);
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
              ...(gestureSx ?? {}),
            },
          },
          ...historyRootSlot,
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

  const presentation = staticConfig?.modalPresentation;
  const cardOnly = Boolean(presentation?.cardOnly);
  const stickyHeaderActions = Boolean(presentation?.stickyHeaderActions);

  const basePaper = detailDialogPaperProps(theme, { cardOnly });
  const paperSlot = {
    ...basePaper,
    sx: {
      ...basePaper.sx,
      ...(cardOnly
        ? {
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }
        : {}),
      ...(fullScreenMdDown
        ? {
            height: "100%",
            maxHeight: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }
        : {}),
      ...(gestureSx ?? {}),
    },
  };

  const dialogContainerPadding = fullScreenMdDown
    ? undefined
    : { p: cardOnly ? 1 : 1.5 };

  const solidIconButtonSx = {
    bgcolor: "action.hover",
    "&:hover": { bgcolor: "action.selected" },
  } as const;

  const frostedIconButtonSx = glassIconButtonSx(theme);

  const legacyHeaderActions = (
    <>
      {HeaderActionsSlot ? (
        <HeaderActionsSlot entityIRI={entityIRI} typeIRI={classIRI} />
      ) : null}
      {!readonly && (
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

  if (stickyHeaderActions) {
    const stickyScrollable = (
      <>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            flexWrap: "wrap",
            columnGap: 0.25,
            rowGap: 0.5,
            p: 1,
            pointerEvents: "none",
            "& > *": { pointerEvents: "auto" },
          }}
        >
          {HeaderActionsSlot ? (
            <HeaderActionsSlot entityIRI={entityIRI} typeIRI={classIRI} />
          ) : null}
          {showEditButton && (
            <IconButton
              size="medium"
              onClick={handleEdit}
              color="inherit"
              aria-label={disableInlineEditing ? t("edit") : t("edit inline")}
              sx={frostedIconButtonSx}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="medium"
            onClick={handleClose}
            color="inherit"
            aria-label={t("close")}
            sx={frostedIconButtonSx}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ mt: theme.spacing(-8) }}>
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
      </>
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
          paper: paperSlot as never,
          ...historyRootSlot,
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            ...(cardOnly
              ? {
                  pointerEvents: "none",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }
              : { overflow: "auto" }),
            ...(!cardOnly && fullScreenMdDown ? { flex: 1, minHeight: 0 } : {}),
            "&:first-of-type": {
              pt: 0,
            },
          }}
        >
          {cardOnly ? (
            <Box
              sx={{
                pointerEvents: "auto",
                overflow: "auto",
                flex: 1,
                minHeight: 0,
                width: "100%",
              }}
            >
              {stickyScrollable}
            </Box>
          ) : (
            stickyScrollable
          )}
        </DialogContent>
      </Dialog>
    );
  }

  const legacyBody = (
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
        {legacyHeaderActions}
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
        paper: paperSlot as never,
        ...historyRootSlot,
      }}
    >
      <DialogContent
        sx={{
          p: fullScreenMdDown ? 2 : 2,
          ...(cardOnly
            ? {
                pointerEvents: "none",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }
            : { overflow: "auto" }),
          ...(!cardOnly && fullScreenMdDown ? { flex: 1, minHeight: 0 } : {}),
          "&:first-of-type": {
            pt: 2,
          },
        }}
      >
        {cardOnly ? (
          <Box
            sx={{
              pointerEvents: "auto",
              overflow: "auto",
              flex: 1,
              minHeight: 0,
              width: "100%",
            }}
          >
            {legacyBody}
          </Box>
        ) : (
          legacyBody
        )}
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
  disableLoad,
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
  disableLoad?: boolean;
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
      enabled: !disableLoad,
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(defaultData),
    },
    loadQueryKey: "show",
  });

  const data = rawData?.document as Record<string, unknown> | undefined;

  const { registerModal } = useModalRegistry(NiceModal);
  const handleEdit = useCallback(() => {
    if (!disableInlineEditing) {
      const modalID = `edit-${typeIRI}-${entityIRI}`;
      registerModal(modalID, EditEntityModal);
      void NiceModal.show(modalID, {
        entityIRI,
        typeIRI,
        data,
        disableLoad: true,
      }).catch(console.error);
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
    registerModal,
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
  disableLoad,
  readonly,
  disableInlineEditing,
  staticConfig,
  onClose,
}: {
  typeIRI: string;
  entityIRI: string;
  defaultData?: unknown;
  disableLoad?: boolean;
  readonly?: boolean;
  disableInlineEditing?: boolean;
  staticConfig: DetailEntityModalStaticConfig | undefined;
  onClose: () => void;
}) {
  const { typeIRIToTypeName } = useAdbContext();
  const { t } = useTranslation();

  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);

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
      disableLoad={disableLoad}
      readonly={readonly}
      disableInlineEditing={disableInlineEditing}
      staticConfig={staticConfig}
      onClose={onClose}
    />
  );
}

export type DetailEntityModalViewProps = EntityDetailModalProps & {
  staticConfig?: DetailEntityModalStaticConfig;
  /**
   * When set, registers with {@link GraviolaNiceModalStackIdProvider} for browser Back / stack semantics.
   */
  modalStackId?: string | number;
  /**
   * When set, dialog roots portal into this node (e.g. translated swipe layer) instead of `document.body`.
   */
  portalContainerElement?: HTMLElement | null;
  /**
   * Horizontal swipe offset for dialog Paper only; keeps MUI backdrop fixed (apply via context inside the view).
   */
  paperGesture?: DetailEntityModalPaperGesture | null;
};

/**
 * Headless detail-modal body (no outer {@link NiceModal.register}). Use from apps that need to own
 * the modal shell (e.g. in-place swipe between entities).
 */
export function DetailEntityModalView({
  staticConfig,
  modalStackId,
  portalContainerElement,
  paperGesture,
  typeIRI,
  entityIRI,
  data: defaultData,
  disableLoad,
  readonly,
  disableInlineEditing,
  onClose,
}: DetailEntityModalViewProps) {
  const handleClose = onClose ?? (() => undefined);
  const inner = (
    <DetailEntityModalPortalContext.Provider
      value={portalContainerElement ?? null}
    >
      <DetailEntityModalPaperGestureContext.Provider
        value={paperGesture ?? null}
      >
        <DetailEntityClassWrapper
          typeIRI={typeIRI ?? ""}
          entityIRI={entityIRI}
          defaultData={defaultData}
          disableLoad={disableLoad}
          readonly={readonly}
          disableInlineEditing={disableInlineEditing}
          staticConfig={staticConfig}
          onClose={handleClose}
        />
      </DetailEntityModalPaperGestureContext.Provider>
    </DetailEntityModalPortalContext.Provider>
  );

  if (
    modalStackId !== undefined &&
    modalStackId !== null &&
    String(modalStackId).length > 0
  ) {
    return (
      <GraviolaNiceModalStackIdProvider niceModalId={String(modalStackId)}>
        {inner}
      </GraviolaNiceModalStackIdProvider>
    );
  }

  return inner;
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
      disableLoad,
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
          disableLoad={disableLoad}
          readonly={readonly}
          disableInlineEditing={disableInlineEditing}
          onClose={handleClose}
          staticConfig={staticConfig}
          modalStackId={modal.id}
        />
      );
    },
  );
}

export const DetailEntityModal = createDetailEntityModal();
