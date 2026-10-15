import { EntityDetailListItem } from "@graviola/edb-advanced-components";
import { SearchbarWithFloatingButton } from "@graviola/edb-basic-components";
import { AutocompleteSuggestion } from "@graviola/edb-core-types";
import { makeFormsPath } from "@graviola/edb-core-utils";
import {
  resolveLinkedReferenceLabel,
  resolveLinkedReferenceLabelKey,
} from "@graviola/edb-core-utils";
import {
  useAdbContext,
  useDataStore,
  useGlobalSearchWithHelper,
  useKeyEventForSimilarityFinder,
  useSimilarityFinderModal,
} from "@graviola/edb-state-hooks";
import { ControlProps, JsonSchema, resolveSchema } from "@jsonforms/core";
import type { SchemaRegistry } from "@graviola/json-schema-utils";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import {
  Box,
  FormControl,
  FormHelperText,
  List,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { JSONSchema7 } from "json-schema";
import merge from "lodash-es/merge";
import isEqual from "lodash-es/isEqual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormHelper } from "./formHelper";
import {
  clearLinkedEntityAtPath,
  resolveLabelKey,
  resolveAcceptedLinkedEntityLabel,
  writeLinkedEntitySelection,
} from "./relationalControlPathWrite";
import {
  readParentReferenceObject,
  resolveRelationalDisplayLabel,
} from "./relationalFieldLabel";

export const InlineCondensedSemanticFormsRendererComponent = (
  props: ControlProps,
) => {
  const {
    id,
    errors,
    schema,
    uischema,
    visible,
    description,
    config,
    data,
    handleChange,
    path,
    rootSchema,
    label,
    enabled,
  } = props;
  const {
    typeIRIToTypeName,
    queryBuildOptions: { primaryFields },
  } = useAdbContext();
  const { dataStore } = useDataStore();
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const enableResultDetailPopper =
    appliedUiSchemaOptions.enableResultDetailPopper as boolean | undefined;
  const {
    $ref,
    typeIRI: typeIRIFromContext,
    mapData,
    getID,
  } = appliedUiSchemaOptions.context || {};
  const ctx = useJsonForms();
  const registry = (ctx?.config as any)?.registry as SchemaRegistry | undefined;
  // Resolve typeIRI: explicit context option → registry O(1) lookup via $ref
  const typeIRI: string | undefined =
    typeIRIFromContext ||
    (registry && $ref ? registry.byPath.get($ref)?.typeIRI : undefined);
  const entityIRI = useMemo(() => {
    if (!data) return null;
    return getID ? getID(data) : data["@id"] || data;
  }, [data, getID]);

  const typeName = useMemo(
    () => typeIRI && typeIRIToTypeName(typeIRI),
    [typeIRI, typeIRIToTypeName],
  );
  const [realLabel, setRealLabel] = useState("");
  const formsPath = useMemo(
    () => makeFormsPath(config?.formsPath, path),
    [config?.formsPath, path],
  );
  const selected = useMemo(
    () =>
      entityIRI
        ? { value: entityIRI || null, label: realLabel }
        : { value: null, label: null },
    [entityIRI, realLabel],
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
    if (!entityIRI) setRealLabel("");
  }, [entityIRI, setRealLabel]);

  const labelKey = useMemo(
    () => resolveLabelKey(primaryFields, typeName),
    [typeName, primaryFields],
  );

  const { hideFinder, showFinder } = useSimilarityFinderModal();
  const handleSelectedChange = useCallback(
    (v: AutocompleteSuggestion | null) => {
      if (!v) {
        clearLinkedEntityAtPath(handleChange, path);
        hideFinder();
        return;
      }
      if (path.endsWith("@id")) {
        const nextId = typeof data === "string" ? data : data?.["@id"];
        if (v.value !== nextId) {
          writeLinkedEntitySelection(handleChange, path, typeIRI, labelKey, v, {
            typeName,
            primaryFields,
          });
        }
      } else {
        const _data = mapData ? mapData(v.value) : v.value;
        if (!isEqual(_data, data)) handleChange(path, _data);
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
      mapData,
      typeIRI,
      labelKey,
      typeName,
      primaryFields,
      ctx?.core?.data,
    ],
  );

  useEffect(() => {
    setRealLabel((_old) => {
      if ((_old && _old.length > 0) || !entityIRI) return _old;
      return resolveRelationalDisplayLabel({
        coreData: ctx?.core?.data,
        path,
        idValue: data,
        typeName,
        primaryFields,
      });
    });
  }, [
    entityIRI,
    ctx?.core?.data,
    path,
    setRealLabel,
    primaryFields,
    typeName,
    data,
  ]);

  const mappedDataAcceptedRef = useRef<(newData: any) => void>(() => {});

  const {
    path: globalPath,
    searchString,
    handleSearchStringChange,
    handleMappedData,
    handleFocus: handleFocusGlobal,
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
    (acceptedIri: string, acceptedData: Record<string, unknown>) => {
      const labelKey = resolveLinkedReferenceLabelKey(typeName, primaryFields);
      const immediateLabel = resolveLinkedReferenceLabel({
        data: acceptedData,
        typeName,
        primaryFields,
        labelKey,
      });
      const finish = (label: string) => {
        handleSelectedChange({ value: acceptedIri, label });
        handleSearchStringChange("");
      };
      if (immediateLabel) {
        finish(immediateLabel);
        return;
      }
      void resolveAcceptedLinkedEntityLabel({
        entityIRI: acceptedIri,
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
      if (typeIRI && formsPath && typeName) {
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

  const finderProps = useMemo(
    () =>
      typeIRI
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

  const handleKeyDown = useKeyEventForSimilarityFinder();

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

  const handleFocus = useCallback(() => {
    onFocus();
    handleFocusGlobal();
    if (finderProps) {
      void showFinder(finderProps);
    }
  }, [onFocus, handleFocusGlobal, showFinder, finderProps]);

  const handleBlur = useCallback(() => {
    onBlur();
  }, [onBlur]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <Typography
          variant={"h5"}
          sx={{
            transform: !hasValue ? "translateY(2.9em)" : "translateY(0)",
            position: "absolute",
            opacity: hasValue ? 1.0 : 0.0,
            transition: "transform 0.2s ease-out, opacity 0.2s ease-out",
            color: (theme: Theme) => theme.palette.grey[500],
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box>
        {!hasValue ? (
          <FormControl fullWidth={!appliedUiSchemaOptions.trim} id={id}>
            <TextField
              fullWidth
              disabled={!enabled}
              autoComplete="off"
              onChange={(ev) => handleFieldSearchChange(ev.target.value)}
              value={searchString || ""}
              label={label}
              inputProps={{
                autoComplete: "off",
                onFocus: handleFocus,
                onBlur: handleBlur,
                onKeyDown: handleKeyDown,
              }}
            />
            <FormHelperText error={!isValid && !showDescription}>
              {firstFormHelperText}
            </FormHelperText>
            <FormHelperText error={!isValid}>
              {secondFormHelperText}
            </FormHelperText>
          </FormControl>
        ) : (
          <List sx={{ marginTop: (theme) => theme.spacing(1) }} dense>
            <EntityDetailListItem
              entityIRI={selected.value}
              typeIRI={typeIRI}
              onClear={enabled && handleClear}
              data={detailsData}
            />
          </List>
        )}
        {globalPath === formsPath && enabled && finderProps ? (
          <SearchbarWithFloatingButton finderProps={finderProps} />
        ) : null}
      </Box>
    </>
  );
};

export const InlineCondensedSemanticFormsRenderer = withJsonFormsControlProps(
  InlineCondensedSemanticFormsRendererComponent,
);
