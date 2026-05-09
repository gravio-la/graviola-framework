import { createContext, useContext } from "react";
import type { GlobalAppConfig } from "@graviola/semantic-jsonform-types";
import { SparqlEndpoint } from "@graviola/edb-core-types";

/**
 * Context for the ADB (schema, env, render registries — storage-agnostic).
 *
 * Router, snackbar, and modal components are **not** configured here; use
 * `GraviolaIntentBusProvider`, `ModalRegistryProvider`, and app-level wiring.
 */
export type AdbContextValue<DeclarativeMappingType> =
  GlobalAppConfig<DeclarativeMappingType> & {
    lockedSPARQLEndpoint?: SparqlEndpoint;
    env: {
      publicBasePath: string;
      baseIRI: string;
    };
  };

export type EdbGlobalContextProps<DeclarativeMappingType> =
  AdbContextValue<DeclarativeMappingType> & {
    children: React.ReactNode;
  };

export const AdbContext = createContext<AdbContextValue<any>>(null);

export const AdbProvider = <DeclarativeMappingType,>({
  children,
  ...rest
}: EdbGlobalContextProps<DeclarativeMappingType>) => {
  return <AdbContext.Provider value={rest}>{children}</AdbContext.Provider>;
};

export const useAdbContext = <DeclarativeMappingType,>() =>
  useContext(AdbContext) as AdbContextValue<DeclarativeMappingType>;
