"use client";

import { type ComponentType, type FC, type ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  FinderSlotProvider,
  GraviolaIntentBusProvider,
  ModalRegistryProvider,
  MODAL_EDIT_ENTITY,
  MODAL_ENTITY_DETAIL,
  MODAL_SIMILARITY_FINDER,
  PathnameProvider,
  SemanticFormSlotProvider,
} from "@graviola/edb-state-hooks";
import {
  EditEntityModal,
  EntityDetailModal,
  SimilarityFinderDrawer,
} from "@graviola/edb-advanced-components";
import { SemanticJsonFormNoOps } from "@graviola/semantic-json-form";
import {
  createLoungeIntentDispatch,
  mergeIntentHandlers,
  type IntentHandlersOverride,
} from "./defaultIntentDispatch";
import { SimilarityFinder } from "./SimilarityFinder";

export type GraviolaLoungeProvidersProps = {
  children: ReactNode;
  intentHandlers?: IntentHandlersOverride;
  /**
   * Defaults register entity detail + edit modals. Pass overrides to swap
   * implementation (same NiceModal ids).
   */
  modalOverrides?: Record<string, ComponentType<any>>;
};

/**
 * Opinionated “lounge” shell: intent bus, modal registry, form + finder slots,
 * pathname for nav. Use **inside** `BrowserRouter` / `RouterProvider` and
 * `SnackbarProvider` when you are **not** using the full
 * {@link GraviolaAppProvider}.
 */
export const GraviolaLoungeProviders: FC<GraviolaLoungeProvidersProps> = ({
  children,
  intentHandlers,
  modalOverrides,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { pathname } = useLocation();

  const baseDispatch = useMemo(
    () => createLoungeIntentDispatch({ navigate, enqueueSnackbar }),
    [navigate, enqueueSnackbar],
  );

  const dispatch = useMemo(
    () => mergeIntentHandlers(baseDispatch, intentHandlers),
    [baseDispatch, intentHandlers],
  );

  const modals = useMemo(
    () => ({
      [MODAL_ENTITY_DETAIL]: EntityDetailModal,
      [MODAL_EDIT_ENTITY]: EditEntityModal,
      [MODAL_SIMILARITY_FINDER]: SimilarityFinderDrawer,
      ...modalOverrides,
    }),
    [modalOverrides],
  );

  return (
    <SemanticFormSlotProvider Component={SemanticJsonFormNoOps}>
      <FinderSlotProvider Component={SimilarityFinder}>
        <PathnameProvider value={pathname}>
          <ModalRegistryProvider modals={modals}>
            <GraviolaIntentBusProvider dispatch={dispatch}>
              {children}
            </GraviolaIntentBusProvider>
          </ModalRegistryProvider>
        </PathnameProvider>
      </FinderSlotProvider>
    </SemanticFormSlotProvider>
  );
};
