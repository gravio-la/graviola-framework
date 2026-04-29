import { camelCaseToTitleCase } from "@graviola/edb-core-utils";
import { extractTypeIRI } from "@graviola/json-schema-utils";
import { resolveSchema } from "@graviola/json-schema-utils";
import type {
  ControlElement,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core";
import { isControl, isLayout } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import { selectEntry } from "../registry/select";
import type {
  DetailDispatch,
  DetailRendererProps,
  DetailRendererRegistryEntry,
  DetailTesterContext,
} from "../types";
import { dataAtScope, pathFromScope } from "./scope";
import { createElement } from "react";

function isGraviolaDetailLayout(uischema: UISchemaElement): boolean {
  if (isLayout(uischema)) return true;
  return (uischema as { type?: string }).type === "TopLevelLayout";
}

function shouldHideProperty(
  propertyName: string | undefined,
  ctx: DetailTesterContext,
): boolean {
  if (!propertyName) return false;
  if (ctx.alwaysShowPropertyNames?.includes(propertyName)) return false;
  if (ctx.hiddenPropertyNames?.includes(propertyName)) return true;
  if (
    ctx.hideLinkedDataProperties &&
    ctx.linkedDataPropertyNames?.includes(propertyName)
  ) {
    return true;
  }
  if (
    ctx.hideHeaderPrimaryFields &&
    ctx.headerPrimaryFieldNames?.includes(propertyName)
  ) {
    return true;
  }
  return false;
}

export function resolvePropertySchema(
  propSchema: JSONSchema7,
  rootSchema: JSONSchema7,
): JSONSchema7 {
  if (propSchema.$ref) {
    const resolved = resolveSchema(rootSchema, propSchema.$ref, rootSchema) as
      | JSONSchema7
      | undefined;
    return resolved ?? propSchema;
  }
  return propSchema;
}

export function buildDispatch(
  registry: DetailRendererRegistryEntry[],
  rootSchema: JSONSchema7,
  rootData: unknown,
  initialCtx: DetailTesterContext,
): (rootUi: UISchemaElement) => React.ReactNode {
  const renderNode = (
    uiSchema: UISchemaElement,
    ctx: DetailTesterContext,
  ): React.ReactNode => {
    if (!uiSchema) return null;

    const elType = (uiSchema as { type?: string }).type;

    if (elType === "Label") {
      const entry = selectEntry(
        registry,
        uiSchema,
        rootSchema as unknown as JsonSchema,
        ctx,
      );
      if (!entry) return null;
      return createElement(entry.renderer, {
        schema: rootSchema,
        data: rootData,
        path: [],
        label: "",
        uiSchema,
        dispatch,
        rootSchema,
        rootData,
        ctx,
      });
    }

    if (isGraviolaDetailLayout(uiSchema)) {
      const entry = selectEntry(
        registry,
        uiSchema,
        rootSchema as unknown as JsonSchema,
        ctx,
      );
      if (!entry) return null;
      return createElement(entry.renderer, {
        schema: rootSchema,
        data: rootData,
        path: [],
        label: "",
        uiSchema,
        dispatch,
        rootSchema,
        rootData,
        ctx,
      });
    }

    if (isControl(uiSchema)) {
      const scope = (uiSchema as ControlElement).scope;
      if (!scope) return null;

      let resolved = resolveSchema(rootSchema, scope, rootSchema) as
        | JSONSchema7
        | undefined;
      if (!resolved) return null;
      resolved = resolvePropertySchema(resolved, rootSchema);

      if (ctx.depth >= ctx.maxDepth && resolved.type === "object") return null;

      const data = dataAtScope(rootData, scope);
      const path = pathFromScope(scope);
      const propertyName = path[path.length - 1];
      if (shouldHideProperty(propertyName, ctx)) return null;

      const typeIRI = extractTypeIRI(resolved) ?? ctx.typeIRI;
      const typeName =
        typeIRI && ctx.typeIRIToTypeName
          ? ctx.typeIRIToTypeName(typeIRI)
          : ctx.typeName;

      const childCtx: DetailTesterContext = {
        ...ctx,
        typeIRI,
        typeName,
        depth: ctx.depth + 1,
      };

      const resolveCombinator = (subSchema: JSONSchema7): React.ReactNode => {
        const sub = resolvePropertySchema(subSchema, rootSchema);
        const br = selectEntry(
          registry,
          uiSchema,
          sub as unknown as JsonSchema,
          childCtx,
        );
        if (!br) return null;
        return createElement(br.renderer, buildControlProps(sub, data, path));
      };

      const buildControlProps = (
        schema: JSONSchema7,
        d: unknown,
        p: string[],
      ): DetailRendererProps => {
        const ce = uiSchema as ControlElement;
        const title =
          typeof schema.title === "string" ? schema.title : undefined;
        const label =
          (typeof ce.label === "string" ? ce.label : undefined) ??
          title ??
          camelCaseToTitleCase(p[p.length - 1] ?? "");

        return {
          schema,
          data: d,
          path: p,
          label,
          uiSchema,
          dispatch,
          rootSchema,
          rootData,
          ctx: childCtx,
          resolveRenderer: resolveCombinator,
        };
      };

      const entry = selectEntry(
        registry,
        uiSchema,
        resolved as unknown as JsonSchema,
        childCtx,
      );
      if (!entry) return null;

      return createElement(
        entry.renderer,
        buildControlProps(resolved, data, path),
      );
    }

    return null;
  };

  const dispatch: DetailDispatch = ({ uiSchema, ctx }) =>
    renderNode(uiSchema, ctx ?? initialCtx);

  return (rootUi) => renderNode(rootUi, initialCtx);
}
