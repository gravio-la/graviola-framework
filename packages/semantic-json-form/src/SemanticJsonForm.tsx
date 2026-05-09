import NiceModal from "@ebay/nice-modal-react";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MODAL_ENTITY_DETAIL,
  useAdbContext,
  useCRUDWithQueryClient,
  useDispatchIntent,
  useGraviolaModal,
} from "@graviola/edb-state-hooks";
import { SemanticJsonFormToolbar } from "./SemanticJsonFormToolbar";
import { SemanticJsonFormNoOps } from "./SemanticJsonFormNoOps";
import { Backdrop, Box, CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";
import { GenericModal } from "@graviola/edb-basic-components";
import type {
  ChangeCause,
  SemanticJsonFormProps,
  LoadResult,
} from "@graviola/semantic-jsonform-types";

export const SemanticJsonForm: FunctionComponent<SemanticJsonFormProps> = ({
  entityIRI,
  data,
  onChange,
  shouldLoadInitially,
  typeIRI,
  schema,
  jsonFormsProps,
  hideToolbar,
  forceEditMode,
  defaultEditMode,
  toolbarChildren,
  onSaveSuccess: onSaveSuccessProp,
  onSaveError: onSaveErrorProp,
  ...rest
}) => {
  const { t } = useTranslation();
  const [managedEditMode, setEditMode] = useState(defaultEditMode || false);
  const editMode = useMemo(
    () =>
      (typeof forceEditMode !== "boolean" && managedEditMode) || forceEditMode,
    [managedEditMode, forceEditMode],
  );

  const { typeIRIToTypeName } = useAdbContext();
  const dispatchIntent = useDispatchIntent();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const typeName = useMemo(
    () => typeIRIToTypeName(typeIRI) ?? "",
    [typeIRIToTypeName, typeIRI],
  );

  const { saveMutation, removeMutation, loadEntity } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI,
    queryOptions: { enabled: true },
    loadQueryKey: "rootLoad",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const isLoading = useMemo(
    () => saveMutation.isPending || isSaving || isReloading,
    [saveMutation.isPending, isSaving, isReloading],
  );

  const refetch = useCallback(() => {
    return loadEntity(entityIRI, typeIRI).then(
      (loadResult: LoadResult | null) => {
        if (loadResult !== null && loadResult?.document) {
          const data = loadResult.document;
          onChange(data);
        }
      },
    );
  }, [loadEntity, entityIRI, typeIRI, schema, onChange]);

  const [initialFetchKey, setInitialFetchKey] = useState<string | null>(null);
  const fetchKey = useMemo(
    () => `${entityIRI}-${typeIRI}`,
    [entityIRI, typeIRI],
  );
  const [initiallyLoaded, setInitiallyLoaded] = useState(false);
  useEffect(() => {
    if (!entityIRI || !typeIRI) return;
    if (initialFetchKey === fetchKey) return;
    setInitiallyLoaded(false);
    setInitialFetchKey(fetchKey);
    refetch().finally(() => {
      setInitiallyLoaded(true);
    });
  }, [
    entityIRI,
    typeIRI,
    refetch,
    fetchKey,
    initialFetchKey,
    setInitialFetchKey,
  ]);

  const handleReset = useCallback(() => {
    NiceModal.show(GenericModal, {
      type: "reset",
    }).then(() => {
      onChange({});
    });
  }, [onChange]);

  const emitSaveSuccess = useCallback(
    (payload: { entityIRI: string; created: boolean }) => {
      if (onSaveSuccessProp) {
        onSaveSuccessProp(payload);
      } else {
        dispatchIntent({
          kind: "entity-saved",
          typeName,
          entityIRI: payload.entityIRI,
          created: payload.created,
          origin: { source: "semantic-json-form:SemanticJsonForm" },
        });
      }
    },
    [dispatchIntent, typeName, onSaveSuccessProp],
  );

  const emitSaveError = useCallback(
    (error: Error) => {
      if (onSaveErrorProp) {
        onSaveErrorProp(error);
      } else {
        dispatchIntent({
          kind: "entity-save-failed",
          typeName,
          entityIRI,
          error,
          origin: { source: "semantic-json-form:SemanticJsonForm" },
        });
      }
    },
    [dispatchIntent, typeName, entityIRI, onSaveErrorProp],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    saveMutation
      .mutateAsync(data)
      .then(async ({ mainDocument }) => {
        if (entityIRI) {
          loadEntity(entityIRI, typeIRI)
            .then((data) => {
              if (data?.document) {
                return onChange(data.document);
              }
            })
            .finally(() => {
              emitSaveSuccess({ entityIRI, created: false });
              setIsSaving(false);
            });
        } else {
          const iri = mainDocument?.["@id"] as string | undefined;
          onChange(mainDocument);
          emitSaveSuccess({
            entityIRI: iri ?? "",
            created: true,
          });
          setIsSaving(false);
        }
      })
      .catch((e: Error) => {
        setIsSaving(false);
        emitSaveError(e);
      });
  }, [
    emitSaveError,
    emitSaveSuccess,
    saveMutation,
    data,
    onChange,
    loadEntity,
    typeIRI,
    entityIRI,
  ]);

  const handleRemove = useCallback(async () => {
    NiceModal.show(GenericModal, {
      type: "delete",
    }).then(() => {
      removeMutation.mutate();
    });
  }, [removeMutation]);

  const handleReload = useCallback(async () => {
    NiceModal.show(GenericModal, {
      type: "reload",
    }).then(() => {
      setIsReloading(true);
      onChange({});
      refetch()
        .then(() => {
          dispatchIntent({
            kind: "reload-completed",
            ok: true,
            message: t("reloaded"),
            origin: { source: "semantic-json-form:SemanticJsonForm:reload" },
          });
        })
        .catch((error: Error) => {
          dispatchIntent({
            kind: "reload-completed",
            ok: false,
            message: t("reload_failed") + ": " + error.message,
            origin: { source: "semantic-json-form:SemanticJsonForm:reload" },
          });
        })
        .finally(() => {
          setIsReloading(false);
        });
    });
  }, [refetch, onChange, setIsReloading, dispatchIntent, t]);

  const handleToggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, [setEditMode]);

  const handleShowEntry = useCallback(() => {
    detailModal.show(
      {
        typeIRI,
        entityIRI: entityIRI,
        readonly: true,
        data,
      },
      {
        origin: { source: "semantic-json-form:SemanticJsonForm:show" },
      },
    );
  }, [typeIRI, entityIRI, detailModal, data]);

  const handleOnChange = useCallback(
    (data: any, reason: ChangeCause) => {
      if (
        (reason === "user" && editMode && !isLoading) ||
        (reason === "mapping" && !isLoading) ||
        (reason === "reload" && isReloading)
      ) {
        onChange(data);
      }
    },
    [onChange, editMode, isLoading, isReloading],
  );

  const jsonFormsPropsFinal = useMemo(
    () => ({
      readonly: !editMode || (shouldLoadInitially && !initiallyLoaded),
      ...(jsonFormsProps || {}),
    }),
    [editMode, initiallyLoaded, jsonFormsProps],
  );

  return (
    <Box sx={{ minHeight: "100%", width: "100%" }}>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <SemanticJsonFormNoOps
        typeIRI={typeIRI}
        data={data}
        onChange={handleOnChange}
        schema={schema}
        formsPath="root"
        jsonFormsProps={jsonFormsPropsFinal}
        toolbar={
          !hideToolbar && (
            <SemanticJsonFormToolbar
              editMode={editMode}
              showLabels={true}
              sticky={true}
              onEditModeToggle={
                !forceEditMode ? handleToggleEditMode : undefined
              }
              onReset={handleReset}
              onSave={handleSave}
              onRemove={entityIRI ? handleRemove : undefined}
              onReload={entityIRI ? handleReload : undefined}
              onShow={entityIRI ? handleShowEntry : undefined}
            >
              {toolbarChildren}
            </SemanticJsonFormToolbar>
          )
        }
        {...rest}
      />
    </Box>
  );
};
