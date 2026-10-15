import {
  ControlElement,
  findUISchema,
  Generate,
  JsonSchema,
  Layout,
  Resolve,
  Scopable,
  StatePropsOfControlWithDetail,
  UISchemaElement,
} from "@jsonforms/core";
import { JsonFormsDispatch, withJsonFormsDetailProps } from "@jsonforms/react";

import isEmpty from "lodash-es/isEmpty";
import { FormHelperText } from "@mui/material";
import { useDerivedDefaultHint } from "./derivedDefaultHintContext";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { tWithDefaultInterpolation } from "./i18nDefaultInterpolation";

/** Title on a `$ref` wrapper property (sibling of `$ref`), not on the resolved target. */
function propertyTitleAtInstancePath(
  rootSchema: JsonSchema,
  instancePath: string,
): string | undefined {
  if (!instancePath) return undefined;
  const segments = instancePath.split(".");
  const propertyName = segments.pop();
  if (!propertyName) return undefined;

  let current: JsonSchema | undefined = rootSchema;
  for (const segment of segments) {
    if (!current || typeof current === "boolean") return undefined;
    if (/^\d+$/.test(segment)) {
      const itemsSchema = current.items;
      const itemNode = Array.isArray(itemsSchema)
        ? itemsSchema[0]
        : itemsSchema;
      if (!itemNode || typeof itemNode === "boolean") return undefined;
      if (itemNode.$ref) {
        const resolved = Resolve.schema(current, "items", rootSchema);
        current = typeof resolved === "boolean" ? undefined : resolved;
      } else {
        current = itemNode;
      }
      continue;
    }
    const propertyNode = current.properties?.[segment];
    if (!propertyNode || typeof propertyNode === "boolean") return undefined;
    if (propertyNode.$ref && !propertyNode.properties) {
      const resolved = Resolve.schema(current, segment, rootSchema);
      current = typeof resolved === "boolean" ? undefined : resolved;
    } else {
      current = propertyNode;
    }
  }

  if (!current || typeof current === "boolean") return undefined;
  const wrapper = current.properties?.[propertyName];
  if (!wrapper || typeof wrapper === "boolean") return undefined;
  return typeof wrapper.title === "string" ? wrapper.title : undefined;
}

const MaterialLinkedObjectRendererComponent = ({
  renderers,
  cells,
  uischemas,
  schema,
  label,
  path,
  visible,
  enabled,
  uischema,
  rootSchema,
  config,
}: StatePropsOfControlWithDetail) => {
  const { t } = useTranslation();
  const derivedHint = useDerivedDefaultHint(path);
  const detailUiSchema = useMemo(() => {
    const controlElement = uischema as ControlElement;
    const explicitUiLabel =
      typeof controlElement.label === "string"
        ? controlElement.label
        : undefined;
    const wrapperTitle = propertyTitleAtInstancePath(rootSchema, path);
    const effectiveLabel = explicitUiLabel ?? wrapperTitle ?? label;

    const uiSchemaElement: Layout | undefined =
      uischemas &&
      (findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        () =>
          isEmpty(path)
            ? Generate.uiSchema(schema, "VerticalLayout")
            : { ...Generate.uiSchema(schema, "Group"), label: effectiveLabel },
        uischema,
        rootSchema,
      ) as Layout | undefined);
    const elements = uiSchemaElement?.elements as Scopable[] | undefined;
    return (
      elements && elements[0]?.scope === "#/properties/@id"
        ? {
            ...uiSchemaElement,
            elements: [
              {
                ...elements[0],
                label: effectiveLabel,
              },
              ...elements.slice(1),
            ],
          }
        : uiSchemaElement
    ) as UISchemaElement;
  }, [uischemas, schema, uischema, path, label, rootSchema]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <JsonFormsDispatch
        enabled={enabled}
        schema={schema}
        uischema={detailUiSchema}
        path={path}
        renderers={renderers}
        cells={cells}
      />
      {derivedHint ? (
        <FormHelperText sx={{ mx: 0 }}>
          {tWithDefaultInterpolation(
            t,
            "derived default hint",
            "übernommen aus {{source}}",
            { source: derivedHint.sourceTitle },
          )}
        </FormHelperText>
      ) : null}
    </>
  );
};

export const MaterialLinkedObjectRenderer = withJsonFormsDetailProps(
  MaterialLinkedObjectRendererComponent,
);
