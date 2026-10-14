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
  decode,
  deriveTypes,
  encode,
  isGroup,
  isLayout,
  resolveSchema,
} from "@jsonforms/core";
import type { OrderBySpec } from "@graviola/edb-core-types";

export type OverrideOptions = {
  scopeOverride?: Record<string, ControlElement>;
  skipScope?: string[];
  /** Root-definition slot name → sort spec (from side schema / Adb context). */
  orderBy?: Record<string, OrderBySpec>;
};

export type GenerateUISchemaOptions = OverrideOptions & {
  layoutType?: string;
  prefix?: string;
  rootSchema?: JsonSchema;
  /**
   * `override` (default): walk all properties and apply scopeOverride / skipScope.
   * `exclusive`: layout contains only scopes listed in scopeOverride (order preserved).
   */
  mode?: "override" | "exclusive";
};
/**
 * Creates a new ILayout.
 * @param layoutType The type of the laoyut
 * @returns the new ILayout
 */
const createLayout = (layoutType: string): Layout => ({
  type: layoutType,
  elements: [],
});

function slotNameFromPropertyScope(scope: string): string | undefined {
  const prefix = "#/properties/";
  if (!scope.startsWith(prefix)) return undefined;
  const encoded = scope.slice(prefix.length);
  if (!encoded || encoded.includes("/")) return undefined;
  try {
    return decode(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Creates a IControlObject with the given label referencing the given ref
 */
export const createControlElement = (
  ref: string,
  overrideOptions?: OverrideOptions,
): ControlElement => {
  const override: Partial<ControlElement> =
    overrideOptions?.scopeOverride?.[ref] ?? {};
  const slot = slotNameFromPropertyScope(ref);
  const orderSpec =
    slot && overrideOptions?.orderBy
      ? overrideOptions.orderBy[slot]
      : undefined;
  const control: ControlElement = {
    type: "Control",
    scope: ref,
    ...override,
  };
  if (orderSpec) {
    control.options = {
      ...(override.options ?? {}),
      orderBy: orderSpec,
      showSortButtons: true,
    };
  }
  return control;
};

/**
 * Wraps the given {@code uiSchema} in a Layout if there is none already.
 * @param uischema The ui schema to wrap in a layout.
 * @param layoutType The type of the layout to create.
 * @returns the wrapped uiSchema.
 */
const wrapInLayoutIfNecessary = (
  uischema: UISchemaElement,
  layoutType: string,
): Layout => {
  if (!isEmpty(uischema) && !isLayout(uischema)) {
    const verticalLayout: Layout = createLayout(layoutType);
    verticalLayout.elements.push(uischema);

    return verticalLayout;
  }

  return uischema as Layout;
};

/**
 * Adds the given {@code labelName} to the {@code layout} if it exists
 * @param layout
 *      The layout which is to receive the label
 * @param labelName
 *      The name of the schema
 */
const addLabel = (layout: Layout, labelName: string) => {
  if (!isEmpty(labelName)) {
    const fixedLabel = startCase(labelName);
    if (isGroup(layout)) {
      layout.label = fixedLabel;
    } else {
      // add label with name
      const label: LabelElement = {
        type: "Label",
        text: fixedLabel,
      };
      layout.elements.push(label);
    }
  }
};

/**
 * Returns whether the given {@code jsonSchema} is a combinator ({@code oneOf}, {@code anyOf}, {@code allOf}) at the root level
 * @param jsonSchema
 *      the schema to check
 */
const isCombinator = (jsonSchema: JsonSchema): boolean => {
  return (
    !isEmpty(jsonSchema) &&
    (!isEmpty(jsonSchema.oneOf) ||
      !isEmpty(jsonSchema.anyOf) ||
      !isEmpty(jsonSchema.allOf))
  );
};

type ControlWithRank = ControlElement & { rank?: number };

function rankOnControl(element: UISchemaElement): number | undefined {
  if (element.type !== "Control") return undefined;
  const rank = (element as ControlWithRank).rank;
  return typeof rank === "number" ? rank : undefined;
}

/** Stable-sort direct Control children: ranked by ascending rank, then unranked. */
export function sortLayoutControlsByRank(elements: UISchemaElement[]): void {
  const controlIndices: number[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].type === "Control") controlIndices.push(i);
  }
  if (controlIndices.length === 0) return;
  if (!controlIndices.some((i) => rankOnControl(elements[i]) !== undefined)) {
    return;
  }

  const controls = controlIndices.map((i) => elements[i]);
  const sorted = [...controls].sort((a, b) => {
    const ra = rankOnControl(a);
    const rb = rankOnControl(b);
    const aRanked = ra !== undefined;
    const bRanked = rb !== undefined;
    if (aRanked && bRanked) return ra - rb;
    if (aRanked && !bRanked) return -1;
    if (!aRanked && bRanked) return 1;
    return 0;
  });

  controlIndices.forEach((idx, j) => {
    elements[idx] = sorted[j];
  });
}

const LINKED_DATA = new Set(["@id", "@type"]);

function isEntityLikeObjectSchema(schema: JsonSchema | undefined): boolean {
  if (schema?.type !== "object") return false;
  const props = schema.properties;
  return Boolean(props?.["@id"]);
}

function isLabelLeafPropertySchema(schema: JsonSchema): boolean {
  const types = deriveTypes(schema);
  return types.some((t) => t === "string" || t === "number" || t === "integer");
}

const MAX_INLINE_ARRAY_ELEMENT_LABEL_PROPS = 4;

function resolvePropertySchema(
  propSchema: JsonSchema,
  rootSchema: JsonSchema | undefined,
): JsonSchema {
  if (propSchema.$ref !== undefined) {
    return resolveSchema(rootSchema, propSchema.$ref, rootSchema) as JsonSchema;
  }
  return propSchema;
}

/** Inline reference / nested pickers (object with `@id`, not a full entity row). */
function isReferencePropertySchema(
  schema: JsonSchema,
  rootSchema: JsonSchema | undefined,
): boolean {
  const resolved = resolvePropertySchema(schema, rootSchema);
  if (resolved.type !== "object") return false;
  return Boolean(resolved.properties?.["@id"]);
}

function isLabelCandidatePropertySchema(
  schema: JsonSchema,
  rootSchema: JsonSchema | undefined,
): boolean {
  const resolved = resolvePropertySchema(schema, rootSchema);
  if (isLabelLeafPropertySchema(resolved)) return true;
  return isReferencePropertySchema(schema, rootSchema);
}

function propertyNamesInRankOrder(
  properties: Record<string, JsonSchema>,
  scopePrefix: string,
  overrideOptions?: OverrideOptions,
): string[] {
  const declarationOrder = Object.keys(properties).filter(
    (name) => !LINKED_DATA.has(name),
  );
  const hasRank = declarationOrder.some((name) => {
    const scope = `${scopePrefix}/properties/${encode(name)}`;
    const rank = (overrideOptions?.scopeOverride?.[scope] as ControlWithRank)
      ?.rank;
    return typeof rank === "number";
  });
  if (!hasRank) return declarationOrder;

  return [...declarationOrder].sort((a, b) => {
    const scopeA = `${scopePrefix}/properties/${encode(a)}`;
    const scopeB = `${scopePrefix}/properties/${encode(b)}`;
    const ra = (overrideOptions?.scopeOverride?.[scopeA] as ControlWithRank)
      ?.rank;
    const rb = (overrideOptions?.scopeOverride?.[scopeB] as ControlWithRank)
      ?.rank;
    const aRanked = typeof ra === "number";
    const bRanked = typeof rb === "number";
    if (aRanked && bRanked) return ra - rb;
    if (aRanked && !bRanked) return -1;
    if (!aRanked && bRanked) return 1;
    return 0;
  });
}

function applyInlineArrayElementLabelProp(
  control: ControlElement,
  arraySchema: JsonSchema,
  arrayScope: string,
  rootSchema: JsonSchema | undefined,
  overrideOptions?: OverrideOptions,
): void {
  const existingOptions = control.options ?? {};
  if (
    existingOptions.elementLabelProp ||
    (Array.isArray(existingOptions.elementLabelProps) &&
      existingOptions.elementLabelProps.length > 0)
  ) {
    return;
  }

  let items = arraySchema.items as JsonSchema | undefined;
  if (!items || typeof items === "boolean") return;
  if (items.$ref !== undefined) {
    items = resolveSchema(rootSchema, items.$ref, rootSchema) as JsonSchema;
  }
  if (items.type !== "object" || isEntityLikeObjectSchema(items)) return;

  const props = items.properties;
  if (!props) return;

  const itemScopePrefix = `${arrayScope}/items`;
  const orderedNames = propertyNamesInRankOrder(
    props,
    itemScopePrefix,
    overrideOptions,
  );

  const elementLabelProps: string[] = [];
  let firstLeafProp: string | undefined;

  for (const propName of orderedNames) {
    const propSchema = props[propName];
    if (!isLabelCandidatePropertySchema(propSchema, rootSchema)) continue;
    if (elementLabelProps.length < MAX_INLINE_ARRAY_ELEMENT_LABEL_PROPS) {
      elementLabelProps.push(propName);
    }
    if (
      !firstLeafProp &&
      isLabelLeafPropertySchema(resolvePropertySchema(propSchema, rootSchema))
    ) {
      firstLeafProp = propName;
    }
  }

  if (elementLabelProps.length === 0) return;

  control.options = {
    ...existingOptions,
    elementLabelProps,
    elementLabelProp: firstLeafProp ?? elementLabelProps[0],
  };
}

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
    return null;
  }

  if (!isEmpty(jsonSchema) && jsonSchema.$ref !== undefined) {
    return generateUISchema(
      resolveSchema(rootSchema, jsonSchema.$ref, rootSchema),
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
    return null;
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
      // traverse properties
      const nextRef: string = currentRef + "/properties";
      Object.keys(jsonSchema.properties).map((propName) => {
        let value = jsonSchema.properties[propName];
        const ref = `${nextRef}/${encode(propName)}`;
        if (value.$ref !== undefined) {
          value = resolveSchema(rootSchema, value.$ref, rootSchema);
        }
        generateUISchema(
          value,
          layout.elements,
          ref,
          propName,
          layoutType,
          rootSchema,
          overrideOptions,
        );
      });
      sortLayoutControlsByRank(layout.elements);
    }

    return layout;
  }

  switch (types[0]) {
    case "object": // object items will be handled by the object control itself
    /* falls through */
    case "array": {
      const controlObject: ControlElement = createControlElement(
        currentRef,
        overrideOptions,
      );
      if (types[0] === "array") {
        applyInlineArrayElementLabelProp(
          controlObject,
          jsonSchema,
          currentRef,
          rootSchema,
          overrideOptions,
        );
      }
      schemaElements.push(controlObject);

      return controlObject;
    }
    /* falls through */
    case "string":
    /* falls through */
    case "number":
    /* falls through */
    case "integer":
    /* falls through */
    case "null":
    /* falls through */
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
 * Generate a default UI schema.
 * @param {JsonSchema} jsonSchema the JSON schema to generated a UI schema for
 * @param {string} layoutType the desired layout type for the root layout
 *        of the generated UI schema
 */
export const generateDefaultUISchema = (
  jsonSchema: JsonSchema,
  options: GenerateUISchemaOptions,
): UISchemaElement => {
  const {
    layoutType = "VerticalLayout",
    prefix = "#",
    rootSchema = jsonSchema,
    scopeOverride = {},
    skipScope = [],
    mode = "override",
  } = options;

  if (mode === "exclusive") {
    const layout = createLayout(layoutType);
    for (const scope of Object.keys(scopeOverride)) {
      if (skipScope.includes(scope)) continue;
      layout.elements.push(
        createControlElement(scope, {
          scopeOverride,
          skipScope,
          orderBy: options.orderBy,
        }),
      );
    }
    sortLayoutControlsByRank(layout.elements);
    return layout;
  }

  return wrapInLayoutIfNecessary(
    generateUISchema(jsonSchema, [], prefix, "", layoutType, rootSchema, {
      scopeOverride,
      skipScope,
      orderBy: options.orderBy,
    }),
    layoutType,
  );
};
