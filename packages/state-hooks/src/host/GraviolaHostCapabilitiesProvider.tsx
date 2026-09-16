import React, { createContext, useContext, useMemo } from "react";
import type {
  HostCapabilityDeclaration,
  HostCapabilities,
} from "@graviola/edb-core-types";

import {
  DEFAULT_HOST_CAPABILITY_DECLARATION,
  createHostCapabilities,
} from "./createHostCapabilities";

const HostCapabilitiesContext = createContext<HostCapabilities | null>(null);

export type GraviolaHostCapabilitiesProviderProps = {
  children: React.ReactNode;
  declaration?: HostCapabilityDeclaration;
};

export function GraviolaHostCapabilitiesProvider({
  children,
  declaration = DEFAULT_HOST_CAPABILITY_DECLARATION,
}: GraviolaHostCapabilitiesProviderProps) {
  const capabilities = useMemo(
    () => createHostCapabilities(declaration),
    [declaration],
  );

  return (
    <HostCapabilitiesContext.Provider value={capabilities}>
      {children}
    </HostCapabilitiesContext.Provider>
  );
}

export function useHostCapabilities(): HostCapabilities {
  const ctx = useContext(HostCapabilitiesContext);
  if (!ctx) {
    return createHostCapabilities(DEFAULT_HOST_CAPABILITY_DECLARATION);
  }
  return ctx;
}
