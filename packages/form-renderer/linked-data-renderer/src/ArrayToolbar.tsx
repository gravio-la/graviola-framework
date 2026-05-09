import NiceModal from "@ebay/nice-modal-react";
import { DiscoverAutocompleteInput } from "@graviola/edb-advanced-components";
import { SearchbarWithFloatingButton } from "@graviola/edb-basic-components";
import { AutocompleteSuggestion } from "@graviola/edb-core-types";
import { PrimaryField } from "@graviola/edb-core-types";
import {
  MODAL_EDIT_ENTITY,
  useAdbContext,
  useGlobalSearchWithHelper,
  useGraviolaModal,
  useKeyEventForSimilarityFinder,
  useSimilarityFinderModal,
} from "@graviola/edb-state-hooks";
import { KnowledgeSources } from "@graviola/semantic-jsonform-types";
import type { JsonSchema7 as JsonFormsSchema } from "@jsonforms/core";
import {
  Box,
  Button,
  FormControl,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { JSONSchema7 } from "json-schema";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useCallback, useMemo } from "react";
import { HowManyItemsModal } from "./HowManyItemsModal";
import trim from "lodash-es/trim";
import cloneDeep from "lodash-es/cloneDeep";

export interface ArrayLayoutToolbarProps {
  label: string;
  errors: string;
  path: string;

  enabled?: boolean;

  labelAsHeadline?: boolean;

  addItem(path: string, data: any): () => void;

  createDefault(): any;

  typeIRI?: string;
  isReifiedStatement?: boolean;
  additionalKnowledgeSources?: string[];

  showCreateButton?: boolean;
  allowCreateMultiple?: boolean;

  prepareNewEntityData?: (newDataStub: any) => Promise<any>;

  /** When false, similarity finder rows omit the side detail Popper. From `uischema.options`. */
  enableResultDetailPopper?: boolean;
}

export const ArrayLayoutToolbar = ({
  label,
  labelAsHeadline,
  errors,
  addItem,
  enabled,
  path,
  schema,
  isReifiedStatement,
  formsPath,
  additionalKnowledgeSources,
  typeIRI: _typeIRI,
  dropdown,
  showCreateButton,
  allowCreateMultiple,
  prepareNewEntityData,
  enableResultDetailPopper,
}: ArrayLayoutToolbarProps & {
  schema?: JsonFormsSchema;
  formsPath?: string;
  dropdown?: boolean;
}) => {
  const {
    createEntityIRI,
    queryBuildOptions: { primaryFields },
    typeIRIToTypeName,
  } = useAdbContext();
  const typeIRI = useMemo(
    () => _typeIRI ?? schema?.properties?.["@type"]?.const,
    [schema, _typeIRI],
  );
  const typeName = useMemo(
    () => typeIRIToTypeName(typeIRI),
    [typeIRI, typeIRIToTypeName],
  );
  const handleSelectedChange = React.useCallback(
    (v: AutocompleteSuggestion) => {
      if (!v || !v.value) return;
      addItem(path, {
        "@id": v.value,
        "@type": typeIRI,
        __label: v.label,
      })();
    },
    [addItem, path],
  );

  const editModal = useGraviolaModal(MODAL_EDIT_ENTITY);
  const { showFinder } = useSimilarityFinderModal();

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const mappedDataAcceptedRef = React.useRef<(newData: any) => void>(() => {});

  const {
    path: globalPath,
    searchString,
    handleSearchStringChange,
    handleFocus,
    isActive,
    setTypeName,
    setPath,
  } = useGlobalSearchWithHelper(
    typeName,
    typeIRI,
    schema as JSONSchema7,
    formsPath,
    (newData: any) => mappedDataAcceptedRef.current(newData),
  );

  const handleMappedDataAccepted = useCallback(
    (newData: any) => {
      addItem(path, newData)();
      handleSearchStringChange("");
      inputRef.current?.focus();
    },
    [addItem, path, handleSearchStringChange],
  );

  mappedDataAcceptedRef.current = handleMappedDataAccepted;

  const handleExistingEntityAccepted = useCallback(
    (iri: string, data: any) => {
      addItem(path, data)();
      handleSelectedChange({ value: undefined, label: "" });
      handleSearchStringChange("");
      inputRef.current?.focus();
    },
    [addItem, path, handleSelectedChange, handleSearchStringChange],
  );

  const handleFieldSearchChange = useCallback(
    (value: string | undefined) => {
      handleSearchStringChange(value);
      if (!dropdown && typeIRI && formsPath && typeName) {
        const q = trim(value || "");
        if (q.length > 0) {
          setTypeName(typeName);
          setPath(formsPath);
          void showFinder({
            finderId: `${formsPath}_${path}`,
            data: {},
            classIRI: typeIRI,
            jsonSchema: schema as JSONSchema7,
            onExistingEntityAccepted: handleExistingEntityAccepted,
            onMappedDataAccepted: handleMappedDataAccepted,
            onSearchChange: handleSearchStringChange,
            additionalKnowledgeSources:
              additionalKnowledgeSources as KnowledgeSources[],
            prepareNewEntityData,
            ...(enableResultDetailPopper === false
              ? { enableResultDetailPopper: false }
              : {}),
          });
        }
      }
    },
    [
      handleSearchStringChange,
      dropdown,
      typeIRI,
      formsPath,
      typeName,
      path,
      schema,
      handleExistingEntityAccepted,
      handleMappedDataAccepted,
      showFinder,
      setTypeName,
      setPath,
      additionalKnowledgeSources,
      prepareNewEntityData,
      enableResultDetailPopper,
    ],
  );

  const handleKeyDown = useKeyEventForSimilarityFinder();

  const [disabled, setDisabled] = React.useState(false);
  const showEditDialog = useCallback(async () => {
    if (!typeName || !typeIRI) return;
    const fieldDefinitions = primaryFields[typeName] as
      | PrimaryField
      | undefined;
    const defaultLabelKey = fieldDefinitions?.label || "title";
    const entityIRI = createEntityIRI(typeName);
    const newItem = {
      "@id": entityIRI,
      "@type": typeIRI,
    };
    if (searchString && trim(searchString).length > 0) {
      newItem[defaultLabelKey] = searchString;
    }
    const preparedData = prepareNewEntityData
      ? await prepareNewEntityData(newItem)
      : newItem;
    setDisabled(true);
    editModal
      .show(
        {
          entityIRI,
          typeIRI,
          typeName,
          data: preparedData,
          disableLoad: true,
        },
        { instanceId: entityIRI },
      )
      .then((result: unknown) => {
        const r = result as { data?: unknown } | undefined;
        const data = r?.data as
          | { "@id"?: string; "@type"?: string }
          | undefined;
        if (data?.["@id"] && data?.["@type"]) {
          addItem(path, cloneDeep(data))();
        }
      })
      .finally(() => {
        setDisabled(false);
      });
  }, [
    editModal,
    typeIRI,
    typeName,
    createEntityIRI,
    primaryFields,
    searchString,
    setDisabled,
    prepareNewEntityData,
    addItem,
    path,
  ]);

  const finderProps = useMemo(
    () =>
      typeIRI
        ? {
            finderId: `${formsPath}_${path}`,
            data: {},
            classIRI: typeIRI,
            jsonSchema: schema as JSONSchema7,
            onExistingEntityAccepted: handleExistingEntityAccepted,
            onMappedDataAccepted: handleMappedDataAccepted,
            onSearchChange: handleSearchStringChange,
            additionalKnowledgeSources:
              additionalKnowledgeSources as KnowledgeSources[],
            prepareNewEntityData,
            ...(enableResultDetailPopper === false
              ? { enableResultDetailPopper: false }
              : {}),
          }
        : null,
    [
      typeIRI,
      formsPath,
      path,
      schema,
      handleExistingEntityAccepted,
      handleMappedDataAccepted,
      handleSearchStringChange,
      additionalKnowledgeSources,
      prepareNewEntityData,
      enableResultDetailPopper,
    ],
  );

  const handleFocusWithFinder = useCallback(() => {
    handleFocus();
    if (!dropdown && finderProps) {
      void showFinder(finderProps);
    }
  }, [handleFocus, dropdown, finderProps, showFinder]);

  const createAndAddItem = useCallback(async () => {
    const newItem = {
      "@id": createEntityIRI(typeName),
      "@type": typeIRI,
      __draft: true,
    };
    const preparedData = prepareNewEntityData
      ? await prepareNewEntityData(newItem)
      : newItem;
    addItem(path, preparedData)();
  }, [prepareNewEntityData, createEntityIRI, typeIRI, typeName, searchString]);

  const handleCreateButtonClick = useCallback(() => {
    if (allowCreateMultiple) {
      NiceModal.show(HowManyItemsModal, {
        entityType: typeName,
      }).then(async (n: number) => {
        for (let i: number = 0; i < n; i++) {
          await createAndAddItem();
        }
      });
    } else {
      createAndAddItem();
    }
  }, [allowCreateMultiple, typeName, createAndAddItem]);

  const { t } = useTranslation();

  return (
    <Box>
      {(isReifiedStatement || labelAsHeadline) && (
        <Box>
          <Typography variant={"h4"}>{label}</Typography>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          marginTop: (theme) =>
            theme.spacing(!dropdown && !isReifiedStatement ? 1 : 2),
          marginBottom: (theme) => theme.spacing(1),
        }}
      >
        {!dropdown && !isReifiedStatement ? (
          <TextField
            fullWidth
            disabled={!enabled}
            autoComplete="off"
            label={labelAsHeadline ? typeName : label}
            onChange={(ev) => handleFieldSearchChange(ev.target.value)}
            value={searchString || ""}
            inputProps={{
              ref: inputRef,
              autoComplete: "off",
              onFocus: handleFocusWithFinder,
              onKeyDown: handleKeyDown,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderTopRightRadius: showCreateButton ? 0 : undefined,
                borderBottomRightRadius: showCreateButton ? 0 : undefined,
              },
            }}
          />
        ) : (
          !isReifiedStatement && (
            <FormControl fullWidth>
              <DiscoverAutocompleteInput
                onCreateNew={showEditDialog}
                loadOnStart={true}
                readonly={!enabled}
                typeIRI={typeIRI}
                typeName={typeName || ""}
                title={label || ""}
                disabled={disabled}
                onSelectionChange={handleSelectedChange}
                onSearchValueChange={handleFieldSearchChange}
                searchString={searchString || ""}
                inputProps={{
                  autoComplete: "off",
                  onFocus: handleFocusWithFinder,
                  onKeyDown: handleKeyDown,
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderTopRightRadius: showCreateButton ? 0 : undefined,
                      borderBottomRightRadius: showCreateButton ? 0 : undefined,
                    },
                  },
                }}
              />
            </FormControl>
          )
        )}
        {showCreateButton && (
          <Tooltip title={t("arrayToolbar.createMultiple", { typeName })}>
            <Button
              onClick={handleCreateButtonClick}
              disabled={!enabled}
              variant="outlined"
              sx={{
                minWidth: "auto",
                px: 1.5,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: 0,
                "&:hover": {
                  borderLeft: 0,
                },
              }}
            >
              <AddIcon />
            </Button>
          </Tooltip>
        )}
      </Box>
      <Box>
        {globalPath === formsPath && !dropdown && finderProps ? (
          <SearchbarWithFloatingButton finderProps={finderProps} />
        ) : null}
      </Box>
    </Box>
  );
};
