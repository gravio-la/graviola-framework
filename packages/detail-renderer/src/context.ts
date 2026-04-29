import { createContext, useContext } from "react";
import type { JSONSchema7 } from "json-schema";
import type { UISchemaElement } from "@jsonforms/core";
import type {
  DetailRendererRegistryEntry,
  DetailViewConfig,
} from "@graviola/edb-detail-renderer-core";

export interface DetailRendererContextValue {
  registry: DetailRendererRegistryEntry[];
  uiSchema?: UISchemaElement;
  config: DetailViewConfig;
  rootSchema: JSONSchema7;
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
