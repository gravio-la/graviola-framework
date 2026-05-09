import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { GraviolaIntent, IntentHandler } from "./types";
import { mergeIntentOrigin } from "./types";
import { useIntentAmbientOrigin } from "./IntentOriginScope";

const IntentBusContext = createContext<IntentHandler | undefined>(undefined);

export type GraviolaIntentBusProviderProps = {
  children: ReactNode;
  dispatch: IntentHandler;
};

export function GraviolaIntentBusProvider({
  children,
  dispatch,
}: GraviolaIntentBusProviderProps) {
  return (
    <IntentBusContext.Provider value={dispatch}>
      {children}
    </IntentBusContext.Provider>
  );
}

export function useIntentBusHandler(): IntentHandler | undefined {
  return useContext(IntentBusContext);
}

export function useDispatchIntent(): (
  intent: GraviolaIntent,
) => Promise<unknown> {
  const handler = useContext(IntentBusContext);
  const ambient = useIntentAmbientOrigin();
  return useCallback(
    (intent: GraviolaIntent): Promise<unknown> => {
      const merged: GraviolaIntent = {
        ...intent,
        origin: mergeIntentOrigin(ambient, intent.origin),
      } as GraviolaIntent;
      if (handler) {
        return Promise.resolve(handler(merged));
      }
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "[GraviolaIntentBus] no handler registered",
          merged.kind,
          merged.origin?.source,
        );
      }
      return Promise.resolve();
    },
    [handler, ambient],
  );
}
