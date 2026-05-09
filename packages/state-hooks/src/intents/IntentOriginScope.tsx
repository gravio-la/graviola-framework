import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { IntentOrigin } from "./types";
import { mergeIntentOrigin } from "./types";

const IntentAmbientOriginContext = createContext<IntentOrigin | undefined>(
  undefined,
);

export type IntentOriginScopeProps = {
  source: string;
  data?: unknown;
  children: ReactNode;
};

export function IntentOriginScope({
  source,
  data,
  children,
}: IntentOriginScopeProps) {
  const parent = useContext(IntentAmbientOriginContext);
  const merged = useMemo(
    () => mergeIntentOrigin(parent, { source, data }),
    [parent, source, data],
  );
  return (
    <IntentAmbientOriginContext.Provider value={merged}>
      {children}
    </IntentAmbientOriginContext.Provider>
  );
}

export function useIntentAmbientOrigin(): IntentOrigin | undefined {
  return useContext(IntentAmbientOriginContext);
}
