import {
  DiscoverAutocompleteInput,
  EntityDetailListItem,
} from "@graviola/edb-advanced-components";
import { SearchbarWithFloatingButton } from "@graviola/edb-basic-components";
import { AutocompleteSuggestion } from "@graviola/edb-core-types";
import { PrimaryField } from "@graviola/edb-core-types";
import { makeFormsPath } from "@graviola/edb-core-utils";
import {
  resolveLinkedReferenceLabel,
  resolveLinkedReferenceLabelKey,
} from "@graviola/edb-core-utils";
import {
  MODAL_EDIT_ENTITY,
  useAdbContext,
  useDataStore,
  useGlobalSearch,
  useGlobalSearchWithHelper,
  useGraviolaModal,
  useKeyEventForSimilarityFinder,
  useSimilarityFinderModal,
} from "@graviola/edb-state-hooks";
import { hidden } from "@graviola/edb-ui-utils";
import { ControlProps, JsonSchema, resolveSchema } from "@jsonforms/core";
import {
  resolveLinkFilterWhere,
  type LinkFilter,
  type SchemaRegistry,
} from "@graviola/json-schema-utils";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  List,
  Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { JSONSchema7 } from "json-schema";
import merge from "lodash-es/merge";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormHelper } from "./formHelper";
import cloneDeep from "lodash-es/cloneDeep";
import {
  clearLinkedEntityAtPath,
  resolveLabelKey,
  resolveAcceptedLinkedEntityLabel,
  writeLinkedEntityFromModalData,
  writeLinkedEntitySelection,
} from "./relationalControlPathWrite";
import {
  readParentReferenceObject,
  resolveRelationalDisplayLabel,
} from "./relationalFieldLabel";

export const InlineDropdownSemanticFormsRendererComponent = (
  props: ControlProps,
) => {
  const {
    id,
    errors,
    schema,
    uischema,
    visible,
    config,
    data,
    handleChange,
    path,
    rootSchema,
    label,
    enabled,
    description,
  } = props;
  const {
    typeIRIToTypeName,
    createEntityIRI,
    queryBuildOptions: { primaryFields },
  } = useAdbContext();
  const { dataStore } = useDataStore();
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const ctx = useJsonForms();
  const registry = (ctx?.config as any)?.registry as SchemaRegistry | undefined;
  const { $ref } = appliedUiSchemaOptions || {};
  const enableFinder = appliedUiSchemaOptions.enableFinder || false;
  /** Search adornment that opens the Entity Finder without opening it on focus/typing. */
  const finderButton = appliedUiSchemaOptions.finderButton === true;
  const enableResultDetailPopper =
    appliedUiSchemaOptions.enableResultDetailPopper as boolean | undefined;
  // Resolve typeIRI: explicit options → schema @type.const → registry O(1) lookup via $ref
  const typeIRI: string | undefined =
    appliedUiSchemaOptions.context?.typeIRI ||
    (schema.properties?.["@type"]?.const as string | undefined) ||
    appliedUiSchemaOptions.typeIRI ||
    (registry && $ref ? registry.byPath.get($ref)?.typeIRI : undefined);
  const prepareNewEntityData =
    typeof appliedUiSchemaOptions.prepareNewEntityData === "function"
      ? appliedUiSchemaOptions.prepareNewEntityData
      : undefined;

  const prepareNewEntityDataFinal = useCallback(
    (stub: any) => {
      const _data =
        prepareNewEntityData && typeof prepareNewEntityData === "function"
          ? prepareNewEntityData(cloneDeep(ctx?.core?.data || {}))
          : {};
      return { ..._data, ...(stub || {}) };
    },
    [ctx?.core?.data, prepareNewEntityData],
  );

  const editModal = useGraviolaModal(MODAL_EDIT_ENTITY);
  const { hideFinder, showFinder } = useSimilarityFinderModal();
  const similarityFinderOpen = useGlobalSearch((s) => s.similarityFinderOpen);

  const typeName = useMemo(
    () => typeIRI && typeIRIToTypeName(typeIRI),
    [typeIRI, typeIRIToTypeName],
  );

  const resolvedLinkFilter = useMemo(() => {
    const spec = appliedUiSchemaOptions.linkFilter as LinkFilter | undefined;
    return resolveLinkFilterWhere(spec, ctx?.core?.data);
  }, [appliedUiSchemaOptions.linkFilter, ctx?.core?.data]);
  const [realLabel, setRealLabel] = useState("");
  const formsPath = useMemo(
    () => makeFormsPath(config?.formsPath, path),
    [config?.formsPath, path],
  );
  const selected = useMemo(
    () =>
      data
        ? {
            value: path.endsWith("@id") ? data : data["@id"] || null,
            label: realLabel,
          }
        : { value: null, label: null },
    [data, realLabel, path],
  );
  const subSchema = useMemo(() => {
    if (!$ref) return;
    // Fast path: O(1) registry lookup
    if (registry) {
      const entry = registry.byPath.get($ref);
      if (entry) return { ...(rootSchema as object), ...entry.resolvedSchema };
    }
    // Fallback: runtime resolution
    const schema2 = { ...schema, $ref };
    const resolvedSchema = resolveSchema(
      schema2 as JsonSchema,
      "",
      rootSchema as JsonSchema,
    );
    return { ...rootSchema, ...resolvedSchema };
  }, [$ref, schema, rootSchema, registry]);

  useEffect(() => {
    if (!data) setRealLabel("");
  }, [data, setRealLabel]);

  const labelKey = useMemo(
    () => resolveLabelKey(primaryFields, typeName),
    [typeName, primaryFields],
  );

  const handleSelectedChange = useCallback(
    (v: AutocompleteSuggestion | null) => {
      if (!v) {
        clearLinkedEntityAtPath(handleChange, path);
        hideFinder();
        return;
      }
      const nextId = path.endsWith("@id") ? data : data?.["@id"];
      if (v.value !== nextId) {
        writeLinkedEntitySelection(handleChange, path, typeIRI, labelKey, v, {
          typeName,
          primaryFields,
        });
      }
      setRealLabel(
        resolveRelationalDisplayLabel({
          coreData: ctx?.core?.data,
          path,
          idValue: v.value,
          typeName,
          primaryFields,
          cachedLabel: v.label,
        }),
      );
    },
    [
      path,
      handleChange,
      data,
      setRealLabel,
      hideFinder,
      typeIRI,
      labelKey,
      typeName,
      primaryFields,
      ctx?.core?.data,
    ],
  );
  const handleAcceptNewEntity = useCallback(
    (accepted: Record<string, unknown>) => {
      writeLinkedEntityFromModalData(handleChange, path, labelKey, accepted, {
        typeName,
        primaryFields,
      });
      setRealLabel(
        resolveRelationalDisplayLabel({
          coreData: ctx?.core?.data,
          path,
          idValue: accepted["@id"],
          typeName,
          primaryFields,
          cachedLabel:
            (typeof accepted.label === "string" && accepted.label) ||
            resolveLinkedReferenceLabel({
              data: accepted,
              typeName,
              primaryFields,
              labelKey,
            }),
        }),
      );
    },
    [
      path,
      handleChange,
      setRealLabel,
      labelKey,
      typeName,
      primaryFields,
      ctx?.core?.data,
    ],
  );

  useEffect(() => {
    setRealLabel((_old) => {
      if ((_old && _old.length > 0) || !data) return _old;
      return resolveRelationalDisplayLabel({
        coreData: ctx?.core?.data,
        path,
        idValue: data,
        typeName,
        primaryFields,
      });
    });
  }, [data, ctx?.core?.data, path, setRealLabel, primaryFields, typeName]);

  const mappedDataAcceptedRef = useRef<(newData: any) => void>(() => {});

  const {
    path: globalPath,
    searchString,
    handleSearchStringChange,
    handleMappedData,
    handleFocus: handleFocusGlobal,
    isActive,
    setTypeName,
    setPath,
  } = useGlobalSearchWithHelper(
    typeName,
    typeIRI,
    subSchema as JSONSchema7,
    formsPath,
    (newData: any) => mappedDataAcceptedRef.current(newData),
  );

  const handleMappedDataAccepted = useCallback(
    (newData: any) => {
      const newIRI = newData["@id"];
      if (!newIRI) return;
      handleSelectedChange({
        value: newIRI,
        label: newData.__label || newIRI,
      });
      handleSearchStringChange("");
    },
    [handleSelectedChange, handleSearchStringChange],
  );

  mappedDataAcceptedRef.current = handleMappedDataAccepted;

  const handleExistingEntityAccepted = useCallback(
    (entityIRI: string, acceptedData: Record<string, unknown>) => {
      const labelKey = resolveLinkedReferenceLabelKey(typeName, primaryFields);
      const immediateLabel = resolveLinkedReferenceLabel({
        data: acceptedData,
        typeName,
        primaryFields,
        labelKey,
      });
      const finish = (label: string) => {
        handleSelectedChange({ value: entityIRI, label });
        handleSearchStringChange("");
      };
      if (immediateLabel) {
        finish(immediateLabel);
        return;
      }
      void resolveAcceptedLinkedEntityLabel({
        entityIRI,
        acceptedData,
        typeName,
        primaryFields,
        loadEntity: dataStore?.loadOne?.bind(dataStore),
      }).then(({ label }) => finish(label));
    },
    [
      handleSelectedChange,
      handleSearchStringChange,
      typeName,
      primaryFields,
      dataStore,
    ],
  );

  const handleMappedDataIntermediate = useCallback(
    (d: any) => {
      handleMappedData(d);
    },
    [handleMappedData],
  );

  const handleFieldSearchChange = useCallback(
    (value: string | undefined) => {
      handleSearchStringChange(value);
      if (enableFinder && typeIRI && formsPath && typeName) {
        const q = (value || "").trim();
        if (q.length > 0) {
          setTypeName(typeName);
          setPath(formsPath);
          void showFinder({
            finderId: `${formsPath}_${path}`,
            data,
            classIRI: typeIRI,
            jsonSchema: schema as JSONSchema7,
            onExistingEntityAccepted: handleExistingEntityAccepted,
            onMappedDataAccepted: handleMappedDataIntermediate,
            onSearchChange: handleSearchStringChange,
            ...(enableResultDetailPopper === false
              ? { enableResultDetailPopper: false }
              : {}),
          });
        }
      }
    },
    [
      handleSearchStringChange,
      enableFinder,
      typeIRI,
      formsPath,
      typeName,
      path,
      data,
      schema,
      handleExistingEntityAccepted,
      handleMappedDataIntermediate,
      showFinder,
      setTypeName,
      setPath,
      enableResultDetailPopper,
    ],
  );

  const [disabled, setDisabled] = useState(false);
  const showEditDialog = useCallback(() => {
    if (!typeName || !typeIRI) return;
    const fieldDefinitions = primaryFields[typeName] as
      | PrimaryField
      | undefined;
    const defaultLabelKey = resolveLinkedReferenceLabelKey(
      typeName,
      primaryFields,
    );
    const entityIRI = createEntityIRI(typeName);
    setDisabled(true);
    const newItemStub = {
      "@id": entityIRI,
      "@type": typeIRI,
      [defaultLabelKey]: searchString,
    };
    const newItem = prepareNewEntityDataFinal(newItemStub);
    editModal
      .show(
        {
          entityIRI,
          typeIRI,
          typeName,
          data: newItem,
          disableLoad: true,
        },
        { instanceId: entityIRI },
      )
      .then((result: unknown) => {
        const r = result as { data?: unknown } | undefined;
        if (r?.data != null && typeof r.data === "object")
          handleAcceptNewEntity(r.data as Record<string, unknown>);
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
    prepareNewEntityDataFinal,
    handleAcceptNewEntity,
  ]);

  const finderProps = useMemo(
    () =>
      typeIRI && (enableFinder || finderButton)
        ? {
            finderId: `${formsPath}_${path}`,
            data,
            classIRI: typeIRI,
            jsonSchema: schema as JSONSchema7,
            onExistingEntityAccepted: handleExistingEntityAccepted,
            onMappedDataAccepted: handleMappedDataIntermediate,
            onSearchChange: handleSearchStringChange,
            ...(enableResultDetailPopper === false
              ? { enableResultDetailPopper: false }
              : {}),
          }
        : null,
    [
      typeIRI,
      enableFinder,
      finderButton,
      formsPath,
      path,
      data,
      schema,
      handleExistingEntityAccepted,
      handleMappedDataIntermediate,
      handleSearchStringChange,
      enableResultDetailPopper,
    ],
  );

  const showAsFocused = useMemo(
    () => isActive && similarityFinderOpen,
    [isActive, similarityFinderOpen],
  );

  const handleClear = useCallback(() => {
    handleSelectedChange(null);
  }, [handleSelectedChange]);

  const hasValue = useMemo(
    () => typeof selected.value === "string",
    [selected],
  );

  const detailsData = useMemo(() => {
    if (!selected.value) return;
    const parent = readParentReferenceObject(ctx?.core?.data, path, data);
    const displayLabel = resolveRelationalDisplayLabel({
      coreData: ctx?.core?.data,
      path,
      idValue: data,
      typeName,
      primaryFields,
      cachedLabel: selected.label,
    });
    return {
      ...(parent ?? {}),
      "@id": selected.value,
      [labelKey]: displayLabel,
    };
  }, [
    selected,
    labelKey,
    ctx?.core?.data,
    path,
    data,
    typeName,
    primaryFields,
  ]);

  const {
    isValid,
    firstFormHelperText,
    secondFormHelperText,
    showDescription,
    onFocus,
    onBlur,
  } = useFormHelper({
    errors: Array.isArray(errors) ? errors : [errors],
    config,
    uischema,
    visible,
    description,
  });

  const handleBlur = useCallback(() => {
    onBlur();
  }, [onBlur]);

  const handleKeyDown = useKeyEventForSimilarityFinder();

  const { t } = useTranslation();
  const openFinder = useCallback(() => {
    if (!finderProps || !typeName || !formsPath) return;
    setTypeName(typeName);
    setPath(formsPath);
    void showFinder(finderProps);
  }, [finderProps, typeName, formsPath, setTypeName, setPath, showFinder]);

  const handleFocus = useCallback(() => {
    onFocus();
    handleFocusGlobal();
    if (enableFinder && finderProps) {
      void showFinder(finderProps);
    }
  }, [onFocus, handleFocusGlobal, enableFinder, finderProps, showFinder]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: (theme) => theme.spacing(1),
      }}
    >
      <Typography
        variant={"h5"}
        sx={{
          ...hidden(hasValue),
          color: (theme: Theme) => theme.palette.grey[500],
          textAlign: "left",
        }}
      >
        {label}
      </Typography>
      {!hasValue ? (
        <FormControl fullWidth={!appliedUiSchemaOptions.trim} id={id}>
          <DiscoverAutocompleteInput
            onCreateNew={showEditDialog}
            loadOnStart={true}
            readonly={!enabled}
            typeIRI={typeIRI}
            typeName={typeName || ""}
            selected={selected}
            title={label || ""}
            disabled={disabled}
            onSelectionChange={handleSelectedChange}
            onSearchValueChange={handleFieldSearchChange}
            searchString={searchString || ""}
            where={resolvedLinkFilter.where}
            filterExhausted={resolvedLinkFilter.unresolved}
            inputProps={{
              autoComplete: "off",
              onFocus: handleFocus,
              onBlur: handleBlur,
              onKeyDown: handleKeyDown,
              ...(showAsFocused && { focused: true }),
            }}
          />
          <FormHelperText error={!isValid && !showDescription}>
            {firstFormHelperText}
          </FormHelperText>
          <FormHelperText error={!isValid}>
            {secondFormHelperText}
          </FormHelperText>
        </FormControl>
      ) : null}
      {!hasValue && finderButton && finderProps ? (
        <Tooltip
          title={
            (t("relationalInput.openFinder", "Entity Finder") as string) || ""
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!enabled}
              onClick={openFinder}
              aria-label="Entity Finder"
              data-testid="relational-open-finder"
            >
              <ManageSearchIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
      {hasValue ? (
        <List sx={{ marginTop: "1em" }} dense>
          <EntityDetailListItem
            entityIRI={selected.value}
            typeIRI={typeIRI}
            onClear={enabled && handleClear}
            data={detailsData}
          />
        </List>
      ) : null}
      {globalPath === formsPath && enableFinder && finderProps ? (
        <SearchbarWithFloatingButton finderProps={finderProps} />
      ) : null}
    </Box>
  );
};

export const InlineDropdownSemanticFormsRenderer = withJsonFormsControlProps(
  InlineDropdownSemanticFormsRendererComponent,
);
