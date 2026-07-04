import {
  AdbContext,
  CrudProviderContext,
  type AdbContextValue,
} from "../provider";
import { useContext, useEffect, type ReactNode } from "react";
import { ContextScope } from "./ContextScope";
import { registerGraviolaContext } from "./registry";
import type { CrudProviderContextValue, ContextDescriptor } from "./types";

export type GraviolaContextProviderProps = {
  contextIRI: string;
  label: string;
  parentContextIRI?: string;
  /** Override ambient CRUD context (defaults to current {@link CrudProviderContext}). */
  crud?: CrudProviderContextValue;
  /** Override ambient ADB context (defaults to current {@link AdbContext} when present). */
  adb?: AdbContextValue<unknown>;
  children: ReactNode;
};

export function GraviolaContextProvider({
  contextIRI,
  label,
  parentContextIRI,
  crud: crudOverride,
  adb: adbOverride,
  children,
}: GraviolaContextProviderProps) {
  const ambientCrud = useContext(CrudProviderContext);
  const ambientAdb = useContext(AdbContext);

  const crud = crudOverride ?? ambientCrud;
  const adb = adbOverride ?? ambientAdb ?? undefined;

  useEffect(() => {
    if (!crud) {
      // eslint-disable-next-line no-console
      console.warn(
        `[GraviolaContextProvider] no CRUD context available for "${contextIRI}" — skipping registry registration`,
      );
      return;
    }

    const descriptor: ContextDescriptor = {
      crud,
      label,
      ...(adb ? { adb } : {}),
      ...(parentContextIRI ? { parentContextIRI } : {}),
    };

    return registerGraviolaContext(contextIRI, descriptor);
  }, [contextIRI, crud, adb, label, parentContextIRI]);

  return <ContextScope contextIRI={contextIRI}>{children}</ContextScope>;
}
