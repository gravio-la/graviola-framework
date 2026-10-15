import { createContext, useContext } from "react";
import type { JSONSchema7 } from "json-schema";
import type { UISchemaElement } from "@jsonforms/core";
import type { OrderByConfig } from "@graviola/edb-core-types";
import type {
  DetailRendererRegistryEntry,
  DetailViewConfig,
  ViewSize,
} from "@graviola/edb-detail-renderer-core";
import type { ComponentType } from "react";

export type ContainedEntityComponentProps = {
  data: unknown;
  schema?: JSONSchema7;
  typeIRI?: string;
  entityIRI?: string;
  onClick?: () => void;
};

export interface DetailRendererContextValue {
  registry: DetailRendererRegistryEntry[];
  uiSchema?: UISchemaElement;
  config: DetailViewConfig;
  /** Same as `config.uiSchemata`; explicit for inline `$ref` array items. */
  detailUiSchemata?: Record<string, UISchemaElement>;
  /** Side-schema orderBy from Adb context. */
  orderBy?: OrderByConfig;
  /** Side-schema asset class kinds from Adb context. */
  assetClasses?: Record<string, "image" | "file">;
  /** Maps entity `@type` IRIs to config type names (inline array item class lookup). */
  typeIRIToTypeName?: (typeIRI: string) => string | undefined;
  rootSchema: JSONSchema7;
  rootData?: unknown;
  /** Injected by {@link @graviola/semantic-views} for nested entity refs. */
  containedEntityComponents?: Partial<
    Record<ViewSize, ComponentType<ContainedEntityComponentProps>>
  >;
}

export const DetailRendererContext =
  createContext<DetailRendererContextValue | null>(null);

export function useDetailRendererContext(): DetailRendererContextValue {
  const ctx = useContext(DetailRendererContext);
  if (!ctx)
    throw new Error(
      "useDetailRendererContext must be used inside <DetailRenderer>",
    );
  return ctx;
}

export function useOptionalDetailRendererContext(): DetailRendererContextValue | null {
  return useContext(DetailRendererContext);
}
