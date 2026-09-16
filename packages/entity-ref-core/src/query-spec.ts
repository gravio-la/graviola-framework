import { parse as parseYaml } from "yaml";

import type {
  EntityQuerySpec,
  EntityQueryTableDensity,
  EntityQueryTableToolbar,
  EntityQueryTableUi,
  EntityQueryTableWidth,
  EntityQueryView,
} from "./types";

function parseView(value: unknown): EntityQueryView | undefined {
  if (value === "table" || value === "list") {
    return value;
  }
  return undefined;
}

function parseDensity(value: unknown): EntityQueryTableDensity | undefined {
  if (value === "comfortable" || value === "compact" || value === "spacious") {
    return value;
  }
  return undefined;
}

function parseToolbar(value: unknown): EntityQueryTableToolbar | undefined {
  if (value === "never" || value === "hover" || value === "always") {
    return value;
  }
  return undefined;
}

function parseWidth(value: unknown): EntityQueryTableWidth | undefined {
  if (value === "full-width" || value === "auto") {
    return value;
  }
  return undefined;
}

function parseTableUi(value: unknown): EntityQueryTableUi | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const obj = value as Record<string, unknown>;
  const table: EntityQueryTableUi = {};
  const density = parseDensity(obj.density);
  const toolbar = parseToolbar(obj.toolbar);
  const width = parseWidth(obj.width);
  if (density) table.density = density;
  if (toolbar) table.toolbar = toolbar;
  if (width) table.width = width;
  if (typeof obj.selection === "boolean") {
    table.selection = obj.selection;
  }
  return Object.keys(table).length > 0 ? table : undefined;
}

/** Parse YAML body of a `graviola-query` fenced code block. */
export function parseEntityQuerySpec(yamlSource: string): EntityQuerySpec {
  const raw = parseYaml(yamlSource);
  if (!raw || typeof raw !== "object") {
    throw new Error("graviola-query block must be a YAML object");
  }
  const obj = raw as Record<string, unknown>;
  const typeName = obj.typeName;
  if (typeof typeName !== "string" || !typeName.trim()) {
    throw new Error("graviola-query requires typeName");
  }

  const spec: EntityQuerySpec = { typeName: typeName.trim() };
  if (obj.view != null) {
    spec.view = parseView(obj.view) ?? "table";
  }
  if (obj.limit != null) {
    spec.limit = Number(obj.limit);
  }
  if (obj.where != null && typeof obj.where === "object") {
    spec.where = obj.where as EntityQuerySpec["where"];
  }
  const table = parseTableUi(obj.table);
  if (table) {
    spec.table = table;
  }
  return spec;
}

/** Language tag for graviola query fenced blocks. */
export const GRAVIOLA_QUERY_LANG = "graviola-query";
