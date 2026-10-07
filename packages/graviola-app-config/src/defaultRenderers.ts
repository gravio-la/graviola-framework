import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { graviolaRenderers } from "@graviola/semantic-json-form";
import {
  MarkdownTextFieldRenderer,
  markdownTester,
} from "@graviola/edb-markdown-renderer";
import {
  LinkedMarkdownRenderer,
  linkedMarkdownTester,
} from "@graviola/linked-markdown-renderer";
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";

/**
 * Markdown renderers for long text bodies. A slot opts in through
 * `gra:form` / `gra:detail` → `options: { markdown: true }`, which the
 * generator passes through verbatim to the JSON Forms control; adding
 * `entityLinking: true` turns `[[Type:id]]` references into live entity
 * links. Both testers rank above the plain string control (10 and 15), so a
 * slot without those options is unaffected.
 */
const markdownRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: markdownTester, renderer: MarkdownTextFieldRenderer },
  { tester: linkedMarkdownTester, renderer: LinkedMarkdownRenderer },
];

/**
 * Sensible default renderer registry: JSON Forms material renderers plus
 * Graviola's linked-data and markdown renderers. Override / extend by passing
 * a `renderers` prop to `<GraviolaAppProvider />`.
 */
export const defaultRenderers: JsonFormsRendererRegistryEntry[] = [
  ...materialRenderers,
  ...graviolaRenderers,
  ...markdownRenderers,
];

/**
 * Default cell renderer registry (material). Override by passing
 * `cellRendererRegistry` to `<GraviolaAppProvider />`.
 */
export const defaultCellRenderers: JsonFormsCellRendererRegistryEntry[] =
  materialCells;
