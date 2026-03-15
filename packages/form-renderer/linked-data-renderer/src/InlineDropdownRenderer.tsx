import { PreloadedOptionSelect } from "@graviola/edb-advanced-components";
import { AutocompleteSuggestion } from "@graviola/edb-core-types";
import { PrimaryField } from "@graviola/edb-core-types";
import { extractFieldIfString } from "@graviola/edb-data-mapping";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import { ControlProps, OwnPropsOfControl, Resolve } from "@jsonforms/core";
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react";
import { FormControl } from "@mui/material";
import merge from "lodash-es/merge";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const InlineDropdownRendererComponent = (props: ControlProps) => {
  const {
    id,
    uischema,
    visible,
    config,
    data,
    handleChange,
    path,
    label,
    enabled,
  } = props;
  const { typeIRIToTypeName, queryBuildOptions } = useAdbContext();
  const { primaryFields } = queryBuildOptions;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const ctx = useJsonForms();
  const [realLabel, setRealLabel] = useState("");
  const selected = useMemo(
    () =>
      data
        ? { value: data || null, label: realLabel }
        : { value: null, label: null },
    [data, realLabel],
  );
  const { typeIRI } = appliedUiSchemaOptions.context || {};

  useEffect(() => {
    if (!data) setRealLabel("");
  }, [data, setRealLabel]);

  const handleSelectedChange = useCallback(
    (v: AutocompleteSuggestion) => {
      if (!v || v.value === null) {
        let p = path;
        if (path.endsWith("@id")) {
          p = path.substring(0, path.length - ".@id".length);
        }
        handleChange(p, undefined);
        return;
      }
      if (v.value !== data) handleChange(path, v.value);
      setRealLabel(v.label);
    },
    [path, handleChange, data, setRealLabel],
  );

  const handleOptionChange = useCallback(
    (e: React.SyntheticEvent, v: AutocompleteSuggestion | null) => {
      e.stopPropagation();
      e.preventDefault();
      handleSelectedChange(v);
    },
    [handleSelectedChange],
  );

  useEffect(() => {
    setRealLabel((_old) => {
      if ((_old && _old.length > 0) || !data) return _old;
      const parentData = Resolve.data(
        ctx?.core?.data,
        path.substring(0, path.length - ("@id".length + 1)),
      );
      const fieldDecl = primaryFields[typeName] as PrimaryField | undefined;
      let label = "";
      if (fieldDecl?.label)
        label = extractFieldIfString(parentData, fieldDecl.label);
      if (typeof label === "object") {
        return "";
      }
      return label;
    });
  }, [data, ctx?.core?.data, path, setRealLabel]);

  const typeName = useMemo(
    () => typeIRI && typeIRIToTypeName(typeIRI),
    [typeIRI, typeIRIToTypeName],
  );

  const limit = useMemo(() => {
    return appliedUiSchemaOptions.limit || 100;
  }, [appliedUiSchemaOptions.limit]);

  const { dataStore, ready } = useDataStore();
  const load = useCallback(
    async (searchString?: string) =>
      typeName && ready && dataStore
        ? (async () => {
            const primaryField: PrimaryField | undefined =
              primaryFields[typeName];
            if (!primaryField) {
              return [];
            }

            const result = await dataStore.findDocumentsAsFlatResultSet(
              typeName,
              {
                ...(searchString ? { search: searchString } : {}),
                fields: [primaryField.label],
              },
              limit,
            );

            try {
              return result.results.bindings
                .map((binding) => ({
                  label:
                    binding[`${primaryField.label}_single`]?.value ||
                    binding["entity"]?.value,
                  value: binding["entity"]?.value,
                }))
                .filter((item) => typeof item.value === "string");
            } catch (error) {
              console.error(error);
              return [];
            }
          })()
        : [],
    [primaryFields, typeName, ready, dataStore, limit],
  );

  if (!visible) {
    return null;
  }

  return (
    <FormControl fullWidth={!appliedUiSchemaOptions.trim} id={id}>
      <PreloadedOptionSelect
        title={label}
        disabled={!enabled}
        // @ts-ignore
        load={load}
        typeIRI={typeIRI}
        value={selected}
        onChange={handleOptionChange}
      />
    </FormControl>
  );
};

export const InlineDropdownRenderer:
  | React.ComponentClass<OwnPropsOfControl>
  | React.FunctionComponent<OwnPropsOfControl> = withJsonFormsControlProps(
  InlineDropdownRendererComponent,
);
