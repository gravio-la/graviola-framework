import NiceModal from "@ebay/nice-modal-react";
import { SearchbarWithFloatingButton } from "@graviola/edb-basic-components";
import {
  useAdbContext,
  useFinderSlot,
  useGlobalSearch,
  useSimilarityFinderModal,
} from "@graviola/edb-state-hooks";
import { SemanticJsonFormNoOpsProps } from "@graviola/semantic-jsonform-types";
import { compileSchema } from "@graviola/json-schema-utils";
import { JsonFormsCore, JsonSchema } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import { Card, CardContent, Grid } from "@mui/material";
import { merge } from "lodash-es";
import { useTranslation } from "next-i18next";
import type { JSONSchema7 } from "json-schema";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { DerivedDefaultHintProvider } from "@graviola/edb-linked-data-renderer";

import { OptionsModal } from "./OptionsModal";
import { useOrderedArrayData } from "./helper/useOrderedArrayData";
import { useDerivedDefaults } from "./helper/useDerivedDefaults";

const WithCard = ({
  children,
  wrapWithinCard,
}: {
  children: React.ReactNode;
  wrapWithinCard?: boolean;
}) =>
  wrapWithinCard ? (
    <Card sx={{ padding: (theme) => theme.spacing(2) }}>
      <CardContent>{children}</CardContent>
    </Card>
  ) : (
    children
  );

export const SemanticJsonFormNoOps: FunctionComponent<
  SemanticJsonFormNoOpsProps
> = ({
  data,
  onChange,
  onError,
  typeIRI,
  schema,
  jsonFormsProps,
  onEntityDataChange,
  toolbar,
  searchText,
  disableSimilarityFinder,
  enableSidebar,
  wrapWithinCard,
  formsPath,
  disabled,
  enableResultDetailPopper,
}) => {
  const {
    createEntityIRI,
    uiSchemaDefaultRegistry,
    rendererRegistry,
    cellRendererRegistry,
    uischemata,
    queryBuildOptions: { typeIRItoTypeName },
    derivedDefaults,
  } = useAdbContext();
  const typeName = useMemo(
    () => typeIRItoTypeName(typeIRI) ?? "",
    [typeIRItoTypeName, typeIRI],
  );
  const { sortForLoad, applyUserChange, syncPrevData, prevDataRef } =
    useOrderedArrayData({
      typeName,
      schema: schema as JSONSchema7 | undefined,
      uischemata,
    });

  const formData = useMemo(
    () => sortForLoad((data ?? {}) as Record<string, unknown>),
    [data, sortForLoad],
  );

  const latestDataRef = useRef(formData);
  useEffect(() => {
    latestDataRef.current = formData;
  }, [formData]);

  const notifyDerivedChange = useCallback(
    (patched: Record<string, unknown>) => {
      syncPrevData(patched);
      onChange?.(patched, "user");
    },
    [onChange, syncPrevData],
  );

  const { onUserChange: applyDerivedDefaults, hintContextValue } =
    useDerivedDefaults({
      schema: schema as JSONSchema7 | undefined,
      config: derivedDefaults,
      onChange: notifyDerivedChange,
      latestDataRef,
    });

  useEffect(() => {
    syncPrevData(formData);
  }, [formData, syncPrevData]);

  const SimilarityFinder = useFinderSlot();

  const handleFormChange = useCallback(
    (state: Pick<JsonFormsCore, "data" | "errors">) => {
      const prev = prevDataRef.current as Record<string, unknown>;
      let next = applyUserChange(prev, state.data as Record<string, unknown>);
      next = applyDerivedDefaults(prev, next);
      latestDataRef.current = next;
      syncPrevData(next);
      onChange?.(next, "user");
      if (onError) onError(state.errors);
    },
    [
      onChange,
      onError,
      applyUserChange,
      applyDerivedDefaults,
      syncPrevData,
      prevDataRef,
    ],
  );

  const { hideFinder } = useSimilarityFinderModal();
  const { t } = useTranslation();

  const handleMappedData = useCallback(
    (newData: any) => {
      if (!newData) return;
      //avoid overriding of id and type by mapped data
      NiceModal.show(OptionsModal, {
        id: "confirm-mapping-dialog",
        content: {
          title: t("merge-or-replace"),
          text: t("confirm-mapping-dialog-message"),
        },
        options: [
          {
            title: t("replace data"),
            value: "replace",
          },
        ],
      }).then((decision: string) => {
        hideFinder();
        onChange((data: any) => {
          if (decision === "replace") {
            return {
              ...newData,
              "@id": data["@id"] || createEntityIRI(typeIRI),
              "@type": typeIRI,
            };
          } else {
            const computedData = merge(data, {
              ...newData,
              "@id": data["@id"] || createEntityIRI(typeIRI),
              "@type": typeIRI,
            });
            return computedData;
          }
        }, "mapping");
      });
    },
    [onChange, hideFinder, t, createEntityIRI, typeIRI],
  );

  const handleEntityIRIChange = useCallback(
    (iri) => {
      onEntityDataChange?.(iri);
      hideFinder();
    },
    [onEntityDataChange, typeIRI, hideFinder],
  );

  const {
    cells: jfpCells,
    renderers: jfpRenderers,
    config,
    ...jfpProps
  } = jsonFormsProps || {};

  // Compile the schema registry once per schema change.
  // Injected into JsonForms config so renderers and testers can use it
  // for O(1) entity classification without runtime $ref resolution.
  const registry = useMemo(
    () => (schema ? compileSchema(schema as any) : undefined),
    [schema],
  );

  const finalJsonFormsProps = useMemo(() => {
    return {
      ...jfpProps,
      uischemas: uiSchemaDefaultRegistry,
      uischema:
        jfpProps.uischema ||
        uischemata?.[typeIRItoTypeName(typeIRI)] ||
        undefined,
      config: {
        ...config,
        formsPath,
        typeIRI,
        registry,
      },
    };
  }, [
    jfpProps,
    uiSchemaDefaultRegistry,
    config,
    formsPath,
    typeIRI,
    uischemata,
    typeIRItoTypeName,
    registry,
  ]);
  const allRenderer = useMemo(
    () => [...(rendererRegistry || []), ...(jfpRenderers || [])],
    [jfpRenderers, rendererRegistry],
  );
  const allCellRenderer = useMemo(
    () => [...(cellRendererRegistry || []), ...(jfpCells || [])],
    [cellRendererRegistry, jfpCells],
  );
  const globalPath = useGlobalSearch((s) => s.path);
  const setSearch = useGlobalSearch((s) => s.setSearch);

  const handleFinderSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
    },
    [setSearch],
  );

  const similarityFinderProps = useMemo(
    () => ({
      finderId: formsPath ?? "semantic-json-form",
      data: formData,
      classIRI: typeIRI,
      jsonSchema: schema as JSONSchema7,
      onEntityIRIChange: handleEntityIRIChange,
      onMappedDataAccepted: handleMappedData,
      onSearchChange: handleFinderSearchChange,
      hideFooter: true,
      ...(enableResultDetailPopper === false
        ? { enableResultDetailPopper: false }
        : {}),
    }),
    [
      formsPath,
      formData,
      typeIRI,
      schema,
      handleEntityIRIChange,
      handleMappedData,
      handleFinderSearchChange,
      enableResultDetailPopper,
    ],
  );

  return (
    <Grid container spacing={0}>
      <Grid flex={1}>
        <Grid container spacing={0}>
          <Grid
            size={
              disableSimilarityFinder || enableSidebar || !searchText ? 12 : 6
            }
          >
            <WithCard wrapWithinCard={wrapWithinCard}>
              {toolbar && React.isValidElement(toolbar) ? toolbar : null}
              <DerivedDefaultHintProvider value={hintContextValue}>
                <JsonForms
                  data={formData}
                  renderers={allRenderer}
                  cells={allCellRenderer}
                  onChange={handleFormChange}
                  schema={schema as JsonSchema}
                  readonly={disabled}
                  {...finalJsonFormsProps}
                />
              </DerivedDefaultHintProvider>
            </WithCard>
          </Grid>
          {!disableSimilarityFinder && !enableSidebar && searchText && (
            <Grid size={6}>
              <SimilarityFinder
                finderId={formsPath}
                search={searchText}
                data={formData}
                classIRI={typeIRI}
                jsonSchema={schema}
                onEntityIRIChange={handleEntityIRIChange}
                onMappedDataAccepted={handleMappedData}
              />
            </Grid>
          )}
        </Grid>
      </Grid>
      {formsPath === globalPath && (
        <Grid>
          <SearchbarWithFloatingButton finderProps={similarityFinderProps} />
        </Grid>
      )}
    </Grid>
  );
};
