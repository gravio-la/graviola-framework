import {
  useGraviolaModal,
  type ShowModalOptions,
} from "../modal-registry/ModalRegistry";
import { useCallback } from "react";
import { useContextIRI } from "./ContextScope";
import { GRAVIOLA_CONTEXT_IRI_PROP } from "./types";

export type ShowModalFn = (
  props: Record<string, unknown>,
  options?: ShowModalOptions,
) => Promise<unknown>;

/**
 * Merge the ambient (or explicit) context IRI into modal props before calling `show`.
 * `modalId` is accepted for call-site readability; `show` is expected to be already
 * bound (e.g. from {@link useGraviolaModal}).
 */
export function showModalInContext(
  show: ShowModalFn,
  modalId: string,
  props: Record<string, unknown>,
  contextIRI: string,
  options?: ShowModalOptions,
): Promise<unknown> {
  void modalId;
  return show({ ...props, [GRAVIOLA_CONTEXT_IRI_PROP]: contextIRI }, options);
}

/** Wrap an existing `show` from {@link useGraviolaModal} with ambient context IRI injection. */
export function useWrapShowModalInContext(show: ShowModalFn): ShowModalFn {
  const contextIRI = useContextIRI();

  return useCallback(
    (props: Record<string, unknown>, options?: ShowModalOptions) =>
      show({ ...props, [GRAVIOLA_CONTEXT_IRI_PROP]: contextIRI }, options),
    [show, contextIRI],
  );
}

/** Convenience: {@link useGraviolaModal} + ambient `graviolaContextIRI` payload merge. */
export function useShowModalInContext(modalId: string) {
  const { show, hide } = useGraviolaModal(modalId);
  const showInContext = useWrapShowModalInContext(show);

  return { show: showInContext, hide };
}
