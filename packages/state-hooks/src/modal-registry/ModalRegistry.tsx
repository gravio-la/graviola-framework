import NiceModal from "@ebay/nice-modal-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { useIntentBusHandler } from "../intents/GraviolaIntentBus";
import type { IntentOrigin } from "../intents/types";
import { mergeIntentOrigin } from "../intents/types";
import { useIntentAmbientOrigin } from "../intents/IntentOriginScope";
import { MODAL_EDIT_ENTITY, MODAL_ENTITY_DETAIL } from "./constants";

const ModalComponentsContext = createContext<
  Record<string, ComponentType<any>>
>({});

export type ModalRegistryProviderProps = {
  children: ReactNode;
  /** Map NiceModal id → modal component (typically `NiceModal.create(...)`). */
  modals: Record<string, ComponentType<any>>;
};

export function ModalRegistryProvider({
  children,
  modals,
}: ModalRegistryProviderProps) {
  useEffect(() => {
    for (const [id, Comp] of Object.entries(modals)) {
      NiceModal.register(id, Comp as never);
    }
  }, [modals]);

  return (
    <ModalComponentsContext.Provider value={modals}>
      {children}
    </ModalComponentsContext.Provider>
  );
}

export type ShowModalOptions = {
  origin?: IntentOrigin;
  /** Explicit instance key (defaults to `props.entityIRI` when present). */
  instanceId?: string;
};

export function useGraviolaModal(modalId: string) {
  const modals = useContext(ModalComponentsContext);
  const dispatchIntent = useIntentBusHandler();
  const ambientOrigin = useIntentAmbientOrigin();

  const show = useCallback(
    (
      props: Record<string, unknown>,
      options?: ShowModalOptions,
    ): Promise<unknown> => {
      const origin = mergeIntentOrigin(ambientOrigin, options?.origin);
      const payload = { ...props, intentOrigin: origin };

      const comp = modals[modalId];

      if (comp) {
        const instanceId =
          options?.instanceId ??
          (typeof props.entityIRI === "string" ? props.entityIRI : undefined);
        const uid = instanceId
          ? `${modalId}:${encodeURIComponent(instanceId)}`
          : modalId;

        NiceModal.register(uid, comp as never);

        if (modalId === MODAL_ENTITY_DETAIL && uid !== modalId) {
          NiceModal.remove(uid);
        }

        return NiceModal.show(uid, payload);
      }

      if (dispatchIntent) {
        if (modalId === MODAL_ENTITY_DETAIL) {
          dispatchIntent({
            kind: "show-entity",
            entityIRI: props.entityIRI as string,
            typeIRI: props.typeIRI as string | undefined,
            typeName: props.typeName as string | undefined,
            origin,
          });
          return Promise.resolve();
        }
        if (modalId === MODAL_EDIT_ENTITY) {
          const typeName = props.typeName as string | undefined;
          const entityIRI = props.entityIRI as string | undefined;
          if (typeName && entityIRI) {
            dispatchIntent({
              kind: "edit-entity",
              typeName,
              entityIRI,
              origin,
            });
          }
          return Promise.resolve();
        }
      }

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(
          "[useGraviolaModal] modal not registered and no intent fallback",
          modalId,
          origin?.source,
        );
      }
      return Promise.resolve();
    },
    [modals, dispatchIntent, ambientOrigin, modalId],
  );

  const hide = useCallback(() => {
    NiceModal.hide(modalId);
  }, [modalId]);

  return { show, hide };
}
