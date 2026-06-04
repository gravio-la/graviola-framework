import type { ControlElement, RankedTester } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";
import type React from "react";

import type { DetailTesterContext } from "../types";

export const VALUE_RENDERER_OPTION = "valueRenderer" as const;
export const VALUE_RENDERER_OPTIONS_KEY = "valueRendererOptions" as const;

export interface ValueRendererProps {
  value: unknown;
  schema: JSONSchema7;
  uiSchema?: ControlElement;
  options?: Record<string, unknown>;
  ctx: DetailTesterContext;
}

export interface ValueRendererEntry {
  /** Stable string key matched by UI schema `options.valueRenderer`. */
  name: string;
  tester: RankedTester;
  renderer: React.ComponentType<ValueRendererProps>;
}
