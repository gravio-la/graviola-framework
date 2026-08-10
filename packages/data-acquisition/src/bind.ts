import { getViaSourcePath } from "@graviola/edb-data-mapping";
import isNil from "lodash-es/isNil";

import type { BindingScope, ParamBinding } from "./types";

const rootOf = (
  scope: BindingScope,
  from: "input" | "document" | "row",
): unknown => {
  if (from === "input") return scope.input;
  if (from === "document") return scope.document;
  return scope.row;
};

export const resolveBinding = (
  binding: ParamBinding,
  scope: BindingScope,
): unknown => {
  if (binding.kind === "const") return binding.value;

  if (binding.kind === "path") {
    const root = rootOf(scope, binding.from);
    let value = getViaSourcePath(root, binding.path);
    if (binding.take === "first" && Array.isArray(value)) {
      value = value[0];
    }
    if (isNil(value) || (Array.isArray(value) && value.length === 0)) {
      if (binding.default !== undefined) return binding.default;
      if (binding.required) {
        throw new Error(
          `Required binding path "${Array.isArray(binding.path) ? binding.path.join(".") : binding.path}" from ${binding.from} is empty`,
        );
      }
      return undefined;
    }
    return value;
  }

  // template
  const params: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(binding.params)) {
    params[k] = resolveBinding(v, scope);
  }
  return renderTemplate(binding.template, params);
};

export const renderTemplate = (
  template: string,
  params: Record<string, unknown>,
): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const v = params[name];
    if (v === undefined || v === null) return "";
    return String(v);
  });

export const resolveParams = (
  params: Record<string, ParamBinding> | undefined,
  scope: BindingScope,
): Record<string, unknown> => {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = resolveBinding(v, scope);
  }
  return out;
};
