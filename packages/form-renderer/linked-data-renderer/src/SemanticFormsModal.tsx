import NiceModal from "@ebay/nice-modal-react";
import { GenericModal, MuiEditDialog } from "@graviola/edb-basic-components";
import { irisToData } from "@graviola/edb-core-utils";
import {
  useAdbContext,
  useCRUDWithQueryClient,
  useDispatchIntent,
  useSemanticFormSlot,
} from "@graviola/edb-state-hooks";
import type { SemanticJsonFormProps } from "@graviola/semantic-jsonform-types";
import { JsonSchema } from "@jsonforms/core";
import { useControlled } from "@mui/material";
import { JSONSchema7 } from "json-schema";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type SemanticFormsModalProps = {
  label?: string;
  open: boolean;
  askClose: () => void;
  askCancel?: () => void;
  semanticJsonFormsProps?: Partial<SemanticJsonFormProps>;
  schema: JsonSchema;
  entityIRI?: string;
  typeIRI: string;
  onChange?: (data: string | undefined) => void;
  formData?: any;
  onFormDataChange?: (data: any) => void;
  children?: React.ReactNode;
  formsPath?: string;
};
export const SemanticFormsModal = (props: SemanticFormsModalProps) => {
  const {
    open,
    schema,
    entityIRI,
    onChange,
    typeIRI,
    label,
    askClose,
    askCancel,
    semanticJsonFormsProps,
    formData: formDataProp,
    onFormDataChange,
    children,
    formsPath,
  } = props;
  const [formData, setFormData] = useControlled({
    name: "FormData",
    controlled: formDataProp,
    default: irisToData(entityIRI, typeIRI),
  });

  const [editMode, setEditMode] = useState(true);

  const { typeIRIToTypeName, uischemata } = useAdbContext();
  const SemanticJsonForm = useSemanticFormSlot();
  const dispatchIntent = useDispatchIntent();
  const typeName = useMemo(
    () => typeIRIToTypeName(typeIRI) ?? "",
    [typeIRIToTypeName, typeIRI],
  );
  const uischema = useMemo(
    () => uischemata?.[typeIRIToTypeName(typeIRI)],
    [typeIRI, typeIRIToTypeName],
  );

  const { loadQuery, saveMutation, removeMutation } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI,
    queryOptions: { enabled: true },
  });
  const { data: remoteData } = loadQuery;

  useEffect(() => {
    if (remoteData) {
      const data = remoteData.document;
      if (!data || !data["@id"] || !data["@type"]) return;
      setFormData(data);
      onFormDataChange?.(data);
    }
  }, [remoteData, setFormData, onFormDataChange]);

  const handleSave = useCallback(async () => {
    saveMutation
      .mutateAsync(formData)
      .then(async () => {
        dispatchIntent({
          kind: "entity-saved",
          typeName,
          entityIRI: formData?.["@id"] ?? entityIRI ?? "",
          created: false,
          origin: { source: "linked-data-renderer:SemanticFormsModal" },
        });
        await loadQuery.refetch();
        askClose();
      })
      .catch((e: Error) => {
        dispatchIntent({
          kind: "entity-save-failed",
          typeName,
          entityIRI,
          error: e,
          origin: { source: "linked-data-renderer:SemanticFormsModal" },
        });
      });
  }, [
    dispatchIntent,
    saveMutation,
    loadQuery,
    formData,
    askClose,
    typeName,
    entityIRI,
  ]);

  const handleRemove = useCallback(async () => {
    NiceModal.show(GenericModal, {
      type: "delete",
    }).then(() => {
      removeMutation.mutate();
      if (entityIRI) {
        dispatchIntent({
          kind: "entity-removed",
          typeName,
          entityIRI,
          origin: { source: "linked-data-renderer:SemanticFormsModal" },
        });
      }
      askClose();
    });
  }, [removeMutation, dispatchIntent, typeName, entityIRI, askClose]);

  const handleReload = useCallback(async () => {
    NiceModal.show(GenericModal, {
      type: "reload",
    }).then(() => {
      loadQuery.refetch();
    });
  }, [loadQuery]);

  const handleDataChange = useCallback(
    (data_: any) => {
      setFormData(data_);
      onFormDataChange?.(data_);
    },
    [setFormData, onFormDataChange],
  );

  const handleEditToggle = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode, setEditMode]);
  return (
    <MuiEditDialog
      title={label}
      open={open}
      onClose={askCancel}
      onCancel={askCancel}
      onSave={handleSave}
      onReload={handleReload}
      onEdit={handleEditToggle}
      editMode={editMode}
      actions={children}
      onRemove={handleRemove}
    >
      <>
        {schema && (
          <SemanticJsonForm
            {...semanticJsonFormsProps}
            data={formData}
            forceEditMode={Boolean(editMode)}
            onChange={handleDataChange}
            typeIRI={typeIRI}
            schema={schema as JSONSchema7}
            jsonFormsProps={{
              uischema: uischema,
            }}
            onEntityChange={onChange}
            formsPath={formsPath}
          />
        )}
      </>
    </MuiEditDialog>
  );
};
