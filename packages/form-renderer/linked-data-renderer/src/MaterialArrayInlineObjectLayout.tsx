import type { OrderBySpec } from "@graviola/edb-core-types";
import {
  ArrayLayoutProps,
  ArrayTranslations,
  composePaths,
  computeLabel,
  createDefaultValue,
  Resolve,
} from "@jsonforms/core";
import { ArrayLayoutToolbar } from "@jsonforms/material-renderers";
import { useJsonForms } from "@jsonforms/react";
import merge from "lodash-es/merge";
import React, { useCallback, useMemo, useState } from "react";

import { buildArrayLayoutEntries } from "./arrayLayoutEntries";
import {
  GraviolaExpandPanelRenderer,
  resolveInlineArrayItemDisplayLabel,
} from "./SimpleExpandPanelRenderer";

const MaterialArrayInlineObjectLayoutComponent = (
  props: ArrayLayoutProps & { translations: ArrayTranslations },
) => {
  const [expanded, setExpanded] = useState<string | boolean>(false);
  const ctx = useJsonForms();
  const realData = Resolve.data(ctx?.core?.data, props.path) as
    | unknown[]
    | undefined;

  const innerCreateDefaultValue = useCallback(
    () => createDefaultValue(props.schema, props.rootSchema),
    [props.schema, props.rootSchema],
  );

  const handleChange = useCallback(
    (panel: string) => (_event: unknown, expandedPanel: boolean) => {
      setExpanded(expandedPanel ? panel : false);
    },
    [],
  );

  const isExpanded = (index: number) =>
    expanded === composePaths(props.path, `${index}`);

  const {
    enabled,
    data,
    path,
    schema,
    arraySchema,
    uischema,
    errors,
    addItem,
    renderers,
    cells,
    label,
    required,
    rootSchema,
    config,
    uischemas,
    description,
    disableAdd,
    disableRemove,
    translations,
  } = props;

  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);
  const doDisableAdd = disableAdd || appliedUiSchemaOptions.disableAdd;
  const doDisableRemove = disableRemove || appliedUiSchemaOptions.disableRemove;

  const orderBySpec = useMemo((): OrderBySpec | undefined => {
    const raw = appliedUiSchemaOptions.orderBy;
    if (raw && typeof raw === "object" && typeof raw.field === "string") {
      return {
        field: raw.field,
        direction: raw.direction ?? "asc",
      };
    }
    return undefined;
  }, [appliedUiSchemaOptions.orderBy]);

  const elementLabelProps = appliedUiSchemaOptions.elementLabelProps as
    | string[]
    | undefined;
  const elementLabelTemplate = appliedUiSchemaOptions.elementLabelTemplate as
    | string
    | undefined;
  const elementLabelProp = appliedUiSchemaOptions.elementLabelProp as
    | string
    | undefined;

  const orderedEntries = useMemo(
    () =>
      buildArrayLayoutEntries(realData, {
        orderBySpec,
        preserveDataOrder: !orderBySpec?.field,
        getItemId: () => undefined,
        getItemLabel: (childData, index) =>
          resolveInlineArrayItemDisplayLabel({
            data: childData,
            childLabelTemplate: elementLabelTemplate,
            elementLabelProps,
            elementLabelProp,
            index,
          }),
      }),
    [
      realData,
      orderBySpec,
      elementLabelProps,
      elementLabelTemplate,
      elementLabelProp,
    ],
  );

  const rowCount = typeof data === "number" ? data : orderedEntries.length;

  return (
    <div>
      <ArrayLayoutToolbar
        translations={translations}
        label={computeLabel(
          label,
          required,
          appliedUiSchemaOptions.hideRequiredAsterisk,
        )}
        description={description}
        errors={errors}
        path={path}
        enabled={enabled}
        addItem={addItem}
        createDefault={innerCreateDefaultValue}
        disableAdd={doDisableAdd}
      />
      <div>
        {rowCount > 0 ? (
          orderedEntries.map(({ index }, position) => (
            <GraviolaExpandPanelRenderer
              enabled={enabled}
              index={index}
              expanded={isExpanded(index)}
              schema={schema}
              arraySchema={arraySchema}
              path={path}
              handleExpansion={handleChange}
              uischema={uischema}
              renderers={renderers}
              cells={cells}
              key={`${path}-${index}`}
              rootSchema={rootSchema}
              enableMoveUp={position !== 0}
              enableMoveDown={position < orderedEntries.length - 1}
              config={config}
              childLabelProp={elementLabelProp}
              elementLabelProps={elementLabelProps}
              elementLabelTemplate={elementLabelTemplate}
              uischemas={uischemas}
              translations={translations}
              disableRemove={doDisableRemove}
            />
          ))
        ) : (
          <p>{translations.noDataMessage}</p>
        )}
      </div>
    </div>
  );
};

export const MaterialArrayInlineObjectLayout = React.memo(
  MaterialArrayInlineObjectLayoutComponent,
);
