import {
  findUISchema,
  Generate,
  Layout,
  Scopable,
  StatePropsOfControlWithDetail,
  UISchemaElement,
} from "@jsonforms/core";
import { JsonFormsDispatch, withJsonFormsDetailProps } from "@jsonforms/react";

import isEmpty from "lodash-es/isEmpty";
import React, { useMemo } from "react";

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
  const detailUiSchema = useMemo(() => {
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
            : { ...Generate.uiSchema(schema, "Group"), label },
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
                label,
              },
              ...elements.slice(1),
            ],
          }
        : uiSchemaElement
    ) as UISchemaElement;
  }, [uischemas, schema, uischema.scope, path, label, uischema, rootSchema]);

  if (!visible) {
    return null;
  }

  return (
    <JsonFormsDispatch
      enabled={enabled}
      schema={schema}
      uischema={detailUiSchema}
      path={path}
      renderers={renderers}
      cells={cells}
    />
  );
};

export const MaterialLinkedObjectRenderer = withJsonFormsDetailProps(
  MaterialLinkedObjectRendererComponent,
);
