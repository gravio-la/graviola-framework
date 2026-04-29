import isEmpty from "lodash-es/isEmpty";
import startCase from "lodash-es/startCase";
import keys from "lodash-es/keys";
import type {
  ControlElement,
  JsonSchema,
  LabelElement,
  Layout,
  UISchemaElement,
} from "@jsonforms/core";
import {
  deriveTypes,
  encode,
  isGroup,
  isLayout,
  resolveSchema,
} from "@jsonforms/core";

export type OverrideOptions = {
  scopeOverride?: Record<string, ControlElement>;
  skipScope?: string[];
};

export type GenerateDefaultDetailUISchemaOptions = OverrideOptions & {
  layoutType?: string;
  prefix?: string;
  rootSchema?: JsonSchema;
};

function isGraviolaDetailLayout(uischema: UISchemaElement): boolean {
  if (isLayout(uischema)) return true;
  return (uischema as { type?: string }).type === "TopLevelLayout";
}

const createLayout = (layoutType: string): Layout => ({
  type: layoutType,
  elements: [],
});

export const createControlElement = (
  ref: string,
  overrideOptions?: OverrideOptions,
): ControlElement => {
  const override = overrideOptions?.scopeOverride?.[ref] || {};
  return {
    type: "Control",
    scope: ref,
    ...override,
  };
};

const wrapInLayoutIfNecessary = (
  uischema: UISchemaElement,
  layoutType: string,
): Layout => {
  if (!isEmpty(uischema) && !isGraviolaDetailLayout(uischema)) {
    const outer: Layout = createLayout(layoutType);
    outer.elements.push(uischema);
    return outer;
  }
  return uischema as Layout;
};

const addLabel = (layout: Layout, labelName: string) => {
  if (!isEmpty(labelName)) {
    const fixedLabel = startCase(labelName);
    if (isGroup(layout)) {
      layout.label = fixedLabel;
    } else {
      const label: LabelElement = {
        type: "Label",
        text: fixedLabel,
      };
      layout.elements.push(label);
    }
  }
};

const isCombinator = (jsonSchema: JsonSchema): boolean => {
  return (
    !isEmpty(jsonSchema) &&
    (!isEmpty(jsonSchema.oneOf) ||
      !isEmpty(jsonSchema.anyOf) ||
      !isEmpty(jsonSchema.allOf))
  );
};

const generateUISchema = (
  jsonSchema: JsonSchema,
  schemaElements: UISchemaElement[],
  currentRef: string,
  schemaName: string,
  layoutType: string,
  rootSchema?: JsonSchema,
  overrideOptions?: OverrideOptions,
): UISchemaElement => {
  if (overrideOptions?.skipScope?.includes(currentRef)) {
    return null as unknown as UISchemaElement;
  }

  if (!isEmpty(jsonSchema) && jsonSchema.$ref !== undefined) {
    return generateUISchema(
      resolveSchema(rootSchema, jsonSchema.$ref, rootSchema) as JsonSchema,
      schemaElements,
      currentRef,
      schemaName,
      layoutType,
      rootSchema,
      overrideOptions,
    );
  }

  if (isCombinator(jsonSchema)) {
    const controlObject: ControlElement = createControlElement(
      currentRef,
      overrideOptions,
    );
    schemaElements.push(controlObject);
    return controlObject;
  }

  const types = deriveTypes(jsonSchema);
  if (types.length === 0) {
    return null as unknown as UISchemaElement;
  }

  if (types.length > 1) {
    const controlObject: ControlElement = createControlElement(
      currentRef,
      overrideOptions,
    );
    schemaElements.push(controlObject);
    return controlObject;
  }

  if (currentRef === "#" && types[0] === "object") {
    const layout: Layout = createLayout(layoutType);
    schemaElements.push(layout);

    if (jsonSchema.properties && keys(jsonSchema.properties).length > 1) {
      addLabel(layout, schemaName);
    }

    if (!isEmpty(jsonSchema.properties)) {
      const nextRef: string = currentRef + "/properties";
      Object.keys(jsonSchema.properties!).map((propName) => {
        let value = jsonSchema.properties![propName];
        const ref = `${nextRef}/${encode(propName)}`;
        if (value.$ref !== undefined) {
          value = resolveSchema(
            rootSchema,
            value.$ref,
            rootSchema,
          ) as JsonSchema;
        }
        generateUISchema(
          value as JsonSchema,
          layout.elements,
          ref,
          propName,
          layoutType,
          rootSchema,
          overrideOptions,
        );
      });
    }

    return layout;
  }

  switch (types[0]) {
    case "object":
    case "array":
    case "string":
    case "number":
    case "integer":
    case "null":
    case "boolean": {
      const controlObject: ControlElement = createControlElement(
        currentRef,
        overrideOptions,
      );
      schemaElements.push(controlObject);
      return controlObject;
    }
    default:
      throw new Error("Unknown type: " + JSON.stringify(jsonSchema));
  }
};

/**
 * JSON Forms–compatible default UISchema for read-only detail views.
 * Root layout defaults to `TopLevelLayout`.
 */
export function generateDefaultDetailUISchema(
  jsonSchema: JsonSchema,
  options: GenerateDefaultDetailUISchemaOptions,
): UISchemaElement {
  const {
    layoutType = "TopLevelLayout",
    prefix = "#",
    rootSchema = jsonSchema,
    scopeOverride = {},
    skipScope = [],
  } = options;
  return wrapInLayoutIfNecessary(
    generateUISchema(jsonSchema, [], prefix, "", layoutType, rootSchema, {
      scopeOverride,
      skipScope,
    }),
    layoutType,
  );
}
