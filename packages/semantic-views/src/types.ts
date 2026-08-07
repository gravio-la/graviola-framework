import type { JSONSchema7 } from "json-schema";
import type { UISchemaElement } from "@jsonforms/core";
import type { ViewConfig, ViewSize } from "@graviola/semantic-jsonform-types";
import type { DetailViewConfig } from "@graviola/edb-detail-renderer-core";
import type { MouseEvent } from "react";

export interface SemanticViewNoOpsProps {
  data: unknown;
  entityIRI?: string;
  schema?: JSONSchema7;
  typeIRI?: string;
  typeName?: string;
  uiSchema?: UISchemaElement;
  config?: Partial<DetailViewConfig>;
  onClick?: (event?: MouseEvent) => void;
  variant?: string;
  motionId?: string;
  motionScope?: string;
  isLoading?: boolean;
}

export interface SemanticViewProps {
  entityIRI: string;
  typeIRI?: string;
  typeName?: string;
  defaultData?: unknown;
  /** Optional schema override (otherwise resolved from AdbContext via typeName). */
  schema?: JSONSchema7;
  uiSchema?: UISchemaElement;
  config?: Partial<DetailViewConfig>;
  onClick?: (event?: MouseEvent) => void;
  variant?: string;
  motionId?: string;
  motionScope?: string;
  disableLoad?: boolean;
  loadQueryKey?: string;
}

export type { ViewSize, ViewConfig };
