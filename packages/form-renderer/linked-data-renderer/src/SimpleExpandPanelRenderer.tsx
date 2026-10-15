import { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import {
  MODAL_ENTITY_DETAIL,
  useCRUDWithQueryClient,
  useGraviolaModal,
  useThumbnailUrl,
} from "@graviola/edb-state-hooks";
import {
  extractEntityPreview,
  resolveLinkedReferenceLabel,
} from "@graviola/edb-core-utils";
import {
  queryOptionMixinBasedOnEntity,
  specialDate2LocalDate,
  withEllipsis,
} from "@graviola/edb-ui-utils";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import {
  ArrayTranslations,
  composePaths,
  ControlElement,
  createId,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  moveDown,
  moveUp,
  removeId,
  Resolve,
  update,
  UpdateArrayContext,
} from "@jsonforms/core";
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  useJsonForms,
  withJsonFormsContext,
} from "@jsonforms/react";
import {
  ArrowDownward,
  ArrowUpward,
  Clear,
  Delete,
  ExpandMore,
  Save,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Grid,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material";
import dot from "dot";
import get from "lodash-es/get";
import merge from "lodash-es/merge";

import {
  resolveInlineArrayItemDetailUISchema,
  resolveInlineArrayItemSchema,
} from "./inlineArrayItemDetailUISchema";
import { useTranslation } from "next-i18next";
import React, {
  ComponentType,
  Dispatch,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ResolveInlineArrayItemDisplayLabelParams = {
  data: unknown;
  childLabelTemplate?: string;
  elementLabelProps?: string[];
  elementLabelProp?: string;
  entityLabel?: string;
  locale?: string;
  index: number;
  primaryFields?: PrimaryFieldDeclaration;
  entityBaseIRI?: string;
};

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeOpaqueId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (UUID_LIKE.test(trimmed)) return true;
  if (/^urn:uuid:/i.test(trimmed)) return true;
  return false;
}

/** Label part for one inline-array field; never falls back to raw IRIs / UUIDs. */
export function formatInlineArrayLabelPart(
  value: unknown,
  options?: {
    primaryFields?: PrimaryFieldDeclaration;
    entityBaseIRI?: string;
  },
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || looksLikeOpaqueId(trimmed)) return undefined;
    return trimmed;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "object" || Array.isArray(value)) return undefined;

  const typeIRI = extractTypeIRI(value as Record<string, unknown>);
  const typeName = typeIRI
    ? typeIRI.split(/[#/]/).filter(Boolean).pop()
    : undefined;
  const fromLinked = resolveLinkedReferenceLabel({
    data: value,
    typeName,
    primaryFields: options?.primaryFields,
  });
  if (fromLinked) return fromLinked;

  if (typeName && options?.primaryFields) {
    const preview = extractEntityPreview({
      data: value,
      typeName,
      typeIRI,
      primaryFields: options.primaryFields,
    });
    if (preview.label?.trim()) {
      return preview.label.trim();
    }
  }

  return undefined;
}

function composeInlineArrayElementLabelSafe(
  data: unknown,
  propNames: string[] | undefined,
  options?: {
    primaryFields?: PrimaryFieldDeclaration;
    entityBaseIRI?: string;
  },
): string | undefined {
  if (!propNames?.length || data == null || typeof data !== "object") {
    return undefined;
  }
  const parts: string[] = [];
  for (const propName of propNames) {
    const part = formatInlineArrayLabelPart(get(data, propName), options);
    if (part) parts.push(part);
  }
  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

/** Collapsed label for inline array rows (template → composed props → legacy fallbacks). */
export function resolveInlineArrayItemDisplayLabel(
  params: ResolveInlineArrayItemDisplayLabelParams,
): string {
  const {
    data,
    childLabelTemplate,
    elementLabelProps,
    elementLabelProp,
    entityLabel,
    locale,
    index,
    primaryFields,
    entityBaseIRI,
  } = params;

  const labelOptions = { primaryFields, entityBaseIRI };

  if (childLabelTemplate && data && typeof data === "object") {
    try {
      const template = dot.template(childLabelTemplate);
      const modifiedData = Object.fromEntries(
        Object.entries(data as Record<string, unknown>).map(
          ([key, value]: [string, unknown]) => {
            if (
              key.toLowerCase().includes("date") &&
              typeof value === "number"
            ) {
              return [key, specialDate2LocalDate(value, locale ?? "en")];
            }
            return [key, value];
          },
        ),
      );
      const rendered = template(modifiedData);
      if (rendered && String(rendered).trim()) {
        return String(rendered);
      }
    } catch (e) {
      console.warn("could not render childLabelTemplate", e);
    }
  }

  if (elementLabelProps?.length) {
    const composed = composeInlineArrayElementLabelSafe(
      data,
      elementLabelProps,
      labelOptions,
    );
    if (composed) return composed;
  }

  if (elementLabelProp && data != null) {
    const formatted = formatInlineArrayLabelPart(
      get(data, elementLabelProp),
      labelOptions,
    );
    if (formatted) return formatted;
  }

  if (entityLabel) return entityLabel;
  if (data && typeof data === "object") {
    const draftLabel = (data as { __label?: string }).__label;
    if (draftLabel && String(draftLabel).trim()) {
      return String(draftLabel);
    }
  }

  return `Item ${index + 1}`;
}

type ArrayPanelIconActionProps = {
  ariaLabel: string;
  disabled?: boolean;
  onActivate: (event: React.MouseEvent | React.KeyboardEvent) => void;
  children: React.ReactNode;
};

/** Avoid nested &lt;button&gt; inside MUI AccordionSummary (which is a button). */
export function ArrayPanelIconAction({
  ariaLabel,
  disabled,
  onActivate,
  children,
}: ArrayPanelIconActionProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onActivate(event);
    }
  };

  return (
    <Box
      component="span"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={(event) => {
        if (disabled) return;
        event.stopPropagation();
        onActivate(event);
      }}
      onKeyDown={handleKeyDown}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        p: 1,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.38 : 1,
        borderRadius: "50%",
        "&:hover": disabled ? undefined : { bgcolor: "action.hover" },
      }}
    >
      {children}
    </Box>
  );
}

type SimpleExpandPanelRendererProps = {
  data: any;
  entityIRI: string;
  typeIRI: string;
  typeName: string;
  index: number;
  count: number;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  onRemove: (entityIRI: string) => void;
  onChange: (data: any) => void;
  path: string;
  childLabelTemplate?: string;
  elementDetailItemPath?: string;
  elementLabelProp?: string;
  elementLabelProps?: string[];
  imagePath?: string;
  formsPath?: string;
  primaryFields: PrimaryFieldDeclaration;
  mapData?: (data: any) => any;
};

export const SimpleExpandPanelRenderer = (
  props: SimpleExpandPanelRendererProps,
) => {
  useJsonForms();
  const {
    data: initialData,
    entityIRI,
    onRemove,
    count,
    childLabelTemplate,
    imagePath,
    elementLabelProp,
    elementLabelProps,
    elementDetailItemPath,
    typeIRI,
    typeName,
    primaryFields,
    mapData,
  } = props;
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);

  const {
    i18n: { language: locale },
  } = useTranslation();

  const { saveMutation, loadQuery } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI,
    queryOptions: {
      enabled: true,
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(initialData),
    },
  });

  const data = loadQuery.data?.document;

  const elementDetailItem = useMemo(
    () => (elementDetailItemPath ? get(data, elementDetailItemPath) : null),
    [elementDetailItemPath, data],
  );

  const draft = data?.__draft && !saveMutation.isSuccess;

  const { label, description, image } = useMemo(() => {
    let imageUrl = null;
    if (imagePath) {
      imageUrl = get(data, imagePath);
    }
    if (!typeName) return { image: imageUrl };
    const fieldDecl = primaryFields[typeName];
    if (data && fieldDecl) {
      const extratedInfo = applyToEachField(
        data,
        fieldDecl,
        extractFieldIfString,
      );
      return {
        image: imageUrl || extratedInfo.image,
        label: extratedInfo.label,
        description: extratedInfo.description,
      };
    }
    return { image: imageUrl };
  }, [data, typeName, imagePath, primaryFields]);

  const realLabel = useMemo(
    () =>
      resolveInlineArrayItemDisplayLabel({
        data,
        childLabelTemplate,
        elementLabelProps,
        elementLabelProp,
        entityLabel: label,
        locale,
        index: count,
      }),
    [
      childLabelTemplate,
      elementLabelProps,
      elementLabelProp,
      data,
      label,
      locale,
      count,
    ],
  );

  const handleSave = useCallback(async () => {
    if (!saveMutation) return;
    saveMutation.mutate(data);
  }, [saveMutation, data]);

  const showDetailModal = useCallback(() => {
    if (elementDetailItem?.["@id"] && elementDetailItem?.["@type"]) {
      detailModal.show(
        {
          typeIRI: elementDetailItem["@type"],
          entityIRI: elementDetailItem["@id"],
          data: elementDetailItem,
          disableInlineEditing: false,
        },
        {
          origin: {
            source: "linked-data-renderer:SimpleExpandPanel:element-detail",
          },
        },
      );
    } else {
      detailModal.show(
        {
          typeIRI,
          entityIRI,
          data,
          disableInlineEditing: false,
        },
        {
          origin: {
            source: "linked-data-renderer:SimpleExpandPanel:main",
          },
        },
      );
    }
  }, [typeIRI, entityIRI, data, elementDetailItem, detailModal]);

  const imageSrc = useThumbnailUrl(
    image,
    { sizeCategory: "listItem" },
    {
      viewSize: "listItem",
      typeName,
      typeIRI,
      entityIRI,
      data,
    },
  );

  return (
    <ListItem
      secondaryAction={
        <Stack direction="row" spacing={1}>
          {draft && (
            <IconButton onClick={handleSave} aria-label={"Save"} size="large">
              <Save />
            </IconButton>
          )}
          <IconButton
            aria-label={"Delete"}
            size="large"
            onClick={() => onRemove && onRemove(entityIRI)}
          >
            <Clear />
          </IconButton>
        </Stack>
      }
    >
      <ListItemButton onClick={!draft ? showDetailModal : undefined}>
        <ListItemAvatar>
          <Avatar aria-label="Index" src={imageSrc}>
            {count + 1}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primaryTypographyProps={{ style: { whiteSpace: "normal" } }}
          secondaryTypographyProps={{ style: { whiteSpace: "normal" } }}
          primary={withEllipsis(realLabel, 80)}
          secondary={withEllipsis(description, 100)}
        />
      </ListItemButton>
    </ListItem>
  );
};

interface OwnPropsOfGraviolaExpandPanel {
  enabled: boolean;
  index: number;
  path: string;
  uischema: ControlElement;
  /** Resolved array item schema (JSON Forms array layout `schema` prop). */
  schema: JsonSchema;
  /** Original array schema when supplied by JSON Forms (`arraySchema` prop). */
  arraySchema?: JsonSchema;
  expanded: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  uischemas?: JsonFormsUISchemaRegistryEntry[];
  rootSchema: JsonSchema;
  enableMoveUp: boolean;
  enableMoveDown: boolean;
  config: any;
  childLabelProp?: string;
  elementLabelProps?: string[];
  elementLabelTemplate?: string;
  handleExpansion(panel: string): (event: unknown, expanded: boolean) => void;
  translations: ArrayTranslations;
  disableRemove?: boolean;
}

interface GraviolaExpandPanelProps extends OwnPropsOfGraviolaExpandPanel {
  childLabel: string;
  childPath: string;
  removeItems(
    path: string,
    toDelete: number[],
  ): (event: React.MouseEvent) => void;
  moveUp(path: string, toMove: number): (event: React.MouseEvent) => void;
  moveDown(path: string, toMove: number): (event: React.MouseEvent) => void;
}

export const GraviolaExpandPanelRendererComponent = (
  props: GraviolaExpandPanelProps,
) => {
  const [labelHtmlId] = useState<string>(() => createId("expand-panel"));

  useEffect(() => {
    return () => {
      removeId(labelHtmlId);
    };
  }, [labelHtmlId]);

  const {
    enabled,
    childLabel,
    childPath,
    index,
    expanded,
    moveDown,
    moveUp,
    enableMoveDown,
    enableMoveUp,
    handleExpansion,
    removeItems,
    path,
    rootSchema,
    schema,
    arraySchema,
    uischema,
    uischemas,
    renderers,
    cells,
    config,
    translations,
    disableRemove,
  } = props;

  const itemSchema = useMemo(
    () => resolveInlineArrayItemSchema(schema, rootSchema),
    [schema, rootSchema],
  );

  const foundUISchema = useMemo(
    () =>
      resolveInlineArrayItemDetailUISchema({
        arraySchema: itemSchema ?? schema,
        arrayControl: uischema,
        rootSchema,
        path: childPath,
        uischemas,
        config,
      }),
    [itemSchema, schema, uischema, rootSchema, childPath, uischemas, config],
  );

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showSortButtons =
    appliedUiSchemaOptions.showSortButtons !== false &&
    appliedUiSchemaOptions.showArrayLayoutSortButtons !== false;

  return (
    <Accordion
      aria-labelledby={labelHtmlId}
      expanded={expanded}
      onChange={handleExpansion(childPath)}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Grid container sx={{ width: "100%" }} alignItems={"center"}>
          <Grid size={{ xs: 7, md: 9 }}>
            <Grid container alignItems={"center"}>
              <Grid size={{ xs: 2, md: 1 }}>
                <Avatar aria-label="Index">{index + 1}</Avatar>
              </Grid>
              <Grid size={{ xs: 10, md: 11 }}>
                <span id={labelHtmlId}>{childLabel}</span>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 5, md: 3 }}>
            <Grid container justifyContent="flex-end">
              <Grid>
                <Grid
                  container
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                >
                  {showSortButtons && enabled ? (
                    <Fragment>
                      <Grid>
                        <Tooltip
                          title={translations.up}
                          placement="bottom"
                          open={enableMoveUp ? undefined : false}
                        >
                          <ArrayPanelIconAction
                            ariaLabel={translations.upAriaLabel}
                            disabled={!enableMoveUp}
                            onActivate={moveUp(path, index)}
                          >
                            <ArrowUpward />
                          </ArrayPanelIconAction>
                        </Tooltip>
                      </Grid>
                      <Grid>
                        <Tooltip
                          title={translations.down}
                          placement="bottom"
                          open={enableMoveDown ? undefined : false}
                        >
                          <ArrayPanelIconAction
                            ariaLabel={translations.downAriaLabel}
                            disabled={!enableMoveDown}
                            onActivate={moveDown(path, index)}
                          >
                            <ArrowDownward />
                          </ArrayPanelIconAction>
                        </Tooltip>
                      </Grid>
                    </Fragment>
                  ) : null}
                  {enabled && !disableRemove ? (
                    <Grid>
                      <Tooltip
                        title={translations.removeTooltip}
                        placement="bottom"
                      >
                        <ArrayPanelIconAction
                          ariaLabel={translations.removeAriaLabel}
                          onActivate={removeItems(path, [index])}
                        >
                          <Delete />
                        </ArrayPanelIconAction>
                      </Tooltip>
                    </Grid>
                  ) : null}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <JsonFormsDispatch
          enabled={enabled}
          schema={itemSchema ?? schema}
          rootSchema={rootSchema}
          uischema={foundUISchema}
          path={childPath}
          key={childPath}
          renderers={renderers}
          cells={cells}
          config={config}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export const ctxDispatchToGraviolaExpandPanelProps = (
  dispatch: Dispatch<unknown>,
) => ({
  removeItems:
    (path: string, toDelete: number[]) => (event: React.MouseEvent) => {
      event.stopPropagation();
      dispatch(
        update(
          path,
          (array) => {
            toDelete
              .sort()
              .reverse()
              .forEach((idx) => array.splice(idx, 1));
            return array;
          },
          { type: "REMOVE", indices: toDelete } as UpdateArrayContext,
        ),
      );
    },
  moveUp: (path: string, toMove: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(
      update(
        path,
        (array) => {
          moveUp(array, toMove);
          return array;
        },
        {
          type: "MOVE",
          moves: [{ from: toMove, to: toMove - 1 }],
        } as UpdateArrayContext,
      ),
    );
  },
  moveDown: (path: string, toMove: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(
      update(
        path,
        (array) => {
          moveDown(array, toMove);
          return array;
        },
        {
          type: "MOVE",
          moves: [{ from: toMove, to: toMove + 1 }],
        } as UpdateArrayContext,
      ),
    );
  },
});

export const withContextToGraviolaExpandPanelProps = (
  Component: ComponentType<GraviolaExpandPanelProps>,
): ComponentType<{
  ctx: JsonFormsStateContext;
  props: OwnPropsOfGraviolaExpandPanel;
}> => {
  return function WithContextToGraviolaExpandPanelProps({
    ctx,
    props,
  }: {
    ctx: JsonFormsStateContext;
    props: OwnPropsOfGraviolaExpandPanel;
  }) {
    const dispatchProps = ctxDispatchToGraviolaExpandPanelProps(ctx.dispatch);
    const {
      childLabelProp,
      elementLabelProps: elementLabelPropsProp,
      elementLabelTemplate: elementLabelTemplateProp,
      schema,
      uischema,
      rootSchema,
      path,
      index,
    } = props;
    const childPath = composePaths(path, `${index}`);
    const appliedUiSchemaOptions = merge({}, props.config, uischema.options);
    const configRecord = props.config as Record<string, unknown> | undefined;
    const primaryFields = configRecord?.primaryFields as
      | PrimaryFieldDeclaration
      | undefined;
    const entityBaseIRI = configRecord?.entityBaseIRI as string | undefined;

    const childLabel = useMemo(() => {
      const childData = Resolve.data(ctx.core?.data, childPath);
      const elementLabelProps =
        elementLabelPropsProp ??
        (appliedUiSchemaOptions.elementLabelProps as string[] | undefined);
      const elementLabelTemplate =
        elementLabelTemplateProp ??
        (appliedUiSchemaOptions.elementLabelTemplate as string | undefined);
      const elementLabelPropResolved =
        childLabelProp ??
        (appliedUiSchemaOptions.elementLabelProp as string | undefined);

      return resolveInlineArrayItemDisplayLabel({
        data: childData,
        childLabelTemplate: elementLabelTemplate,
        elementLabelProps,
        elementLabelProp: elementLabelPropResolved,
        index,
        primaryFields,
        entityBaseIRI,
      });
    }, [
      ctx.core?.data,
      childPath,
      childLabelProp,
      uischema,
      appliedUiSchemaOptions,
      elementLabelPropsProp,
      elementLabelTemplateProp,
      index,
      primaryFields,
      entityBaseIRI,
    ]);

    return (
      <Component
        {...props}
        {...dispatchProps}
        childLabel={childLabel}
        childPath={childPath}
        uischemas={props.uischemas}
      />
    );
  };
};

export const withJsonFormsGraviolaExpandPanelProps = (
  Component: ComponentType<GraviolaExpandPanelProps>,
): ComponentType<OwnPropsOfGraviolaExpandPanel> =>
  withJsonFormsContext(withContextToGraviolaExpandPanelProps(Component));

export const GraviolaExpandPanelRenderer = React.memo(
  withJsonFormsGraviolaExpandPanelProps(GraviolaExpandPanelRendererComponent),
);
