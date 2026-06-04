import NiceModal from "@ebay/nice-modal-react";
import { encodeIRI } from "@graviola/edb-core-utils";
import type { GraviolaIntent, IntentHandler } from "@graviola/edb-state-hooks";
import { MODAL_ENTITY_DETAIL } from "@graviola/edb-state-hooks";
import type { NavigateFunction } from "react-router-dom";
import type { LoungeSnackbar } from "./lounge-types";

export function createLoungeIntentDispatch(opts: {
  navigate: NavigateFunction;
  enqueueSnackbar: LoungeSnackbar["enqueueSnackbar"];
}): IntentHandler {
  return (intent: GraviolaIntent) => {
    switch (intent.kind) {
      case "edit-entity":
        void opts.navigate(
          `/create/${intent.typeName}?encID=${encodeIRI(intent.entityIRI)}`,
        );
        break;
      case "create-entity":
        void opts.navigate(`/create/${intent.typeName}`);
        break;
      case "list-entities":
        void opts.navigate(`/list/${intent.typeName}`);
        break;
      case "show-entity":
        void NiceModal.show(MODAL_ENTITY_DETAIL, {
          entityIRI: intent.entityIRI,
          typeIRI: intent.typeIRI,
          data: intent.data,
          readonly: true,
          disableInlineEditing: true,
        });
        break;
      case "navigate":
        void opts.navigate(intent.href);
        break;
      case "entity-saved":
        opts.enqueueSnackbar(intent.created ? "Created" : "Saved", {
          variant: "success",
        });
        break;
      case "entity-save-failed":
        opts.enqueueSnackbar(`Error while saving ${intent.error.message}`, {
          variant: "error",
        });
        break;
      case "entity-removed":
        opts.enqueueSnackbar("Removed", { variant: "success" });
        break;
      case "entity-removal-failed":
        opts.enqueueSnackbar(intent.error.message, { variant: "error" });
        break;
      case "reload-completed":
        opts.enqueueSnackbar(intent.message, {
          variant: intent.ok ? "success" : "error",
        });
        break;
      default:
        break;
    }
  };
}

export type IntentHandlersOverride = Partial<
  Record<GraviolaIntent["kind"], IntentHandler>
>;

export function mergeIntentHandlers(
  base: IntentHandler,
  overrides?: IntentHandlersOverride,
): IntentHandler {
  return (intent: GraviolaIntent) => {
    const fn = overrides?.[intent.kind];
    if (fn) {
      return fn(intent);
    }
    return base(intent);
  };
}
