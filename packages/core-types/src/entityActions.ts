/** App-shell ↔ UI entity action contract. Pure types, no React dependency (icons are typed structurally). Candidate for extraction into its own package. */

/** Host capability identifiers negotiated between shell and entity actions. */
export type HostCapabilityId =
  | "open-in-modal"
  | "open-in-route"
  | "open-in-new-tab"
  | "open-in-window"
  | "edit-entity"
  | "download"
  | (string & {});

export type ActionTarget = {
  entityIRI?: string;
  typeIRI?: string;
  typeName?: string;
  data?: unknown;
};

/** What an application shell declares it can do. */
export type HostCapabilityDeclaration = {
  supports: HostCapabilityId[];
  entityRoute?: (target: ActionTarget & { entityIRI: string }) => string | null;
};

/** Resolved capabilities consumed by entity action selection. */
export type HostCapabilities = {
  has: (id: HostCapabilityId, target?: ActionTarget) => boolean;
  entityHref: (target: ActionTarget) => string | null;
};

/** Built-in entity action intents; `custom` is dispatched via `onEntityAction`. */
export type EntityActionIntent =
  | "show"
  | "edit"
  | "open-in-route"
  | "open-in-new-tab"
  | "open-in-window"
  | "custom";

export interface EntityActionDef {
  id: string;
  label: string;
  /** Emoji or short label icon hint for storybook / simple cases. */
  icon?: string;
  intent: EntityActionIntent;
  /** When true, render as M3 filled button; otherwise tonal/text. */
  primary?: boolean;
  destructive?: boolean;
  /** Menu section label for context menus. */
  section?: string;
  /** Direct href for download / external links. */
  href?: string;
  /** Imperative handler — takes precedence over {@link intent}. */
  run?: (targets: ActionTarget[]) => void | Promise<void>;
}
