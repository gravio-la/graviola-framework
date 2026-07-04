import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CONTEXT_IRI } from "./types";

const ContextIRIContext = createContext<string>(DEFAULT_CONTEXT_IRI);

export type ContextScopeProps = {
  contextIRI: string;
  children: ReactNode;
};

export function ContextScope({ contextIRI, children }: ContextScopeProps) {
  return (
    <ContextIRIContext.Provider value={contextIRI}>
      {children}
    </ContextIRIContext.Provider>
  );
}

export function useContextIRI(): string {
  return useContext(ContextIRIContext);
}
