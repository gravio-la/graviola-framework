import React, { createContext, useContext } from "react";
import type { ComponentType } from "react";
import type { ValueRendererEntry } from "@graviola/edb-detail-renderer-core";
import { defaultValueRenderers } from "@graviola/edb-detail-renderer";

import { DefaultEntityChip } from "./defaultEntityChip";

export type JsonLdChipComponentProps = {
  entityIRI?: string;
  typeIRI?: string;
  typeName?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
};

export type JsonLdTableContextValue = {
  ChipComponent: ComponentType<JsonLdChipComponentProps>;
  valueRenderers: ValueRendererEntry[];
  onShowEntry?: (entityIRI: string, typeIRI?: string) => void;
  typeIRIToTypeName?: (iri: string) => string | undefined;
  locale?: string;
};

const defaultContextValue: JsonLdTableContextValue = {
  ChipComponent: DefaultEntityChip,
  valueRenderers: defaultValueRenderers,
};

const JsonLdTableContext =
  createContext<JsonLdTableContextValue>(defaultContextValue);

export function JsonLdTableProvider({
  value,
  children,
}: {
  value?: Partial<JsonLdTableContextValue>;
  children: React.ReactNode;
}) {
  const merged: JsonLdTableContextValue = {
    ...defaultContextValue,
    ...value,
    valueRenderers: value?.valueRenderers ?? defaultContextValue.valueRenderers,
    ChipComponent: value?.ChipComponent ?? defaultContextValue.ChipComponent,
  };
  return (
    <JsonLdTableContext.Provider value={merged}>
      {children}
    </JsonLdTableContext.Provider>
  );
}

export function useJsonLdTableContext(): JsonLdTableContextValue {
  return useContext(JsonLdTableContext);
}
