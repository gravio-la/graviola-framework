import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { graviolaRenderers } from "@graviola/semantic-json-form";
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";

/**
 * Sensible default renderer registry: JSON Forms material renderers plus
 * Graviola's linked-data renderers. Override / extend by passing a
 * `renderers` prop to `<GraviolaAppProvider />`.
 */
export const defaultRenderers: JsonFormsRendererRegistryEntry[] = [
  ...materialRenderers,
  ...graviolaRenderers,
];

/**
 * Default cell renderer registry (material). Override by passing
 * `cellRendererRegistry` to `<GraviolaAppProvider />`.
 */
export const defaultCellRenderers: JsonFormsCellRendererRegistryEntry[] =
  materialCells;
