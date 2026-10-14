import type { OrderBySpec } from "@graviola/edb-core-types";
import { useCallback, useMemo, useRef, type MutableRefObject } from "react";
import type { JSONSchema7 } from "json-schema";

import {
  applyUserFormDataOrder,
  integerFieldsForOrderSpecs,
  orderSpecsForType,
  sortLoadedFormData,
} from "./orderedArrayData";

export function useOrderedArrayData(options: {
  typeName: string;
  schema: JSONSchema7 | undefined;
  uischemata: Record<string, unknown> | undefined;
}) {
  const { typeName, schema, uischemata } = options;

  const specs = useMemo(
    () => orderSpecsForType(uischemata, typeName),
    [uischemata, typeName],
  );

  const integerFields = useMemo(
    () => integerFieldsForOrderSpecs(schema, specs),
    [schema, specs],
  );

  const prevDataRef = useRef<Record<string, unknown>>({});

  const sortForLoad = useCallback(
    <T extends Record<string, unknown>>(data: T) =>
      sortLoadedFormData(data, specs),
    [specs],
  );

  const applyUserChange = useCallback(
    <T extends Record<string, unknown>>(prev: T, next: T) =>
      applyUserFormDataOrder(prev, next, specs, integerFields),
    [specs, integerFields],
  );

  const syncPrevData = useCallback((data: Record<string, unknown>) => {
    prevDataRef.current = data;
  }, []);

  const hasOrderSpecs = useMemo(() => Object.keys(specs).length > 0, [specs]);

  return {
    specs,
    integerFields,
    prevDataRef,
    sortForLoad,
    applyUserChange,
    syncPrevData,
    hasOrderSpecs,
  } as {
    specs: Record<string, OrderBySpec>;
    integerFields: Set<string>;
    prevDataRef: MutableRefObject<Record<string, unknown>>;
    sortForLoad: <T extends Record<string, unknown>>(data: T) => T;
    applyUserChange: <T extends Record<string, unknown>>(prev: T, next: T) => T;
    syncPrevData: (data: Record<string, unknown>) => void;
    hasOrderSpecs: boolean;
  };
}
