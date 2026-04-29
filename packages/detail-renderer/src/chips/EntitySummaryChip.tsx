import React from "react";
import type { JSONSchema7 } from "json-schema";
import { rankWith, isStringControl } from "@jsonforms/core";
import type {
  ChipDefinition,
  ChipRendererEntry,
  ChipsConfig,
  DetailTesterContext,
} from "@graviola/edb-detail-renderer-core";
import {
  entityRefTester,
  resolveChipRenderer,
} from "@graviola/edb-detail-renderer-core";
import { defaultChipsConfig } from "./defaultChips";
import { EntityChipRenderer } from "./renderers/EntityChipRenderer";
import { SimpleLabelRenderer } from "./renderers/SimpleLabelRenderer";

export interface EntitySummaryChipProps {
  schema: JSONSchema7;
  data: unknown;
  path?: string[];
  chipRegistry?: ChipRendererEntry[];
  chipsConfig?: ChipsConfig;
  variant?: "chip" | "label";
  onClick?: () => void;
  typeIRIToTypeName?: (iri: string) => string | undefined;
}

function wrapDefinitionShortcut(
  schema: JSONSchema7,
  definition: ChipDefinition,
): ChipRendererEntry {
  const isEntity = Boolean(schema.properties?.["@id"]);
  if (isEntity) {
    return {
      tester: entityRefTester,
      computeDefinition: () => definition,
      renderer: EntityChipRenderer,
    };
  }
  return {
    tester: rankWith(1, isStringControl),
    computeDefinition: () => definition,
    renderer: SimpleLabelRenderer,
  };
}

export function EntitySummaryChip({
  schema,
  data,
  path = [],
  chipRegistry,
  chipsConfig: chipsConfigProp,
  variant = "chip",
  onClick,
  typeIRIToTypeName,
}: EntitySummaryChipProps) {
  const chipsConfig: ChipsConfig =
    chipsConfigProp ??
    ({
      registry: chipRegistry ?? defaultChipsConfig.registry,
      byTypeIRI: defaultChipsConfig.byTypeIRI,
    } satisfies ChipsConfig);

  const ctx: DetailTesterContext = {
    rootSchema: schema,
    depth: 0,
    maxDepth: 99,
    typeIRIToTypeName,
  };

  const resolution = resolveChipRenderer(schema, path, chipsConfig, ctx);
  if (!resolution) return null;

  const entry: ChipRendererEntry =
    resolution.mode === "shortcut"
      ? wrapDefinitionShortcut(schema, resolution.definition)
      : resolution.entry;

  const definition = entry.computeDefinition(schema, data, path);

  return React.createElement(entry.renderer, {
    schema,
    data,
    path,
    definition,
    variant,
    onClick,
  });
}
