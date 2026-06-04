export type IntentOrigin = {
  source: string;
  data?: unknown;
};

type WithOrigin<T> = T & { origin?: IntentOrigin };

export type GraviolaIntent =
  | WithOrigin<{ kind: "edit-entity"; typeName: string; entityIRI: string }>
  | WithOrigin<{
      kind: "show-entity";
      typeName?: string;
      typeIRI?: string;
      entityIRI: string;
      data?: unknown;
    }>
  | WithOrigin<{ kind: "create-entity"; typeName: string; entityIRI?: string }>
  | WithOrigin<{ kind: "list-entities"; typeName: string }>
  | WithOrigin<{ kind: "navigate"; href: string }>
  | WithOrigin<{
      kind: "entity-saved";
      typeName: string;
      entityIRI: string;
      created: boolean;
    }>
  | WithOrigin<{
      kind: "entity-save-failed";
      typeName: string;
      entityIRI?: string;
      error: Error;
    }>
  | WithOrigin<{ kind: "entity-removed"; typeName: string; entityIRI: string }>
  | WithOrigin<{
      kind: "entity-removal-failed";
      typeName: string;
      entityIRI: string;
      error: Error;
    }>
  | WithOrigin<{ kind: "reload-completed"; ok: boolean; message: string }>;

export type IntentHandler = (intent: GraviolaIntent) => void | Promise<unknown>;

export function mergeIntentOrigin(
  parent: IntentOrigin | undefined,
  local: IntentOrigin | undefined,
): IntentOrigin | undefined {
  if (!parent && !local) return undefined;
  if (!parent) return local;
  if (!local) return parent;
  let mergedData: unknown;
  if (parent.data !== undefined || local.data !== undefined) {
    const pdata =
      parent.data !== undefined &&
      typeof parent.data === "object" &&
      parent.data !== null &&
      !Array.isArray(parent.data)
        ? (parent.data as Record<string, unknown>)
        : {};
    const ldata =
      local.data !== undefined &&
      typeof local.data === "object" &&
      local.data !== null &&
      !Array.isArray(local.data)
        ? (local.data as Record<string, unknown>)
        : {};
    mergedData = { ...pdata, ...ldata };
  }
  return {
    source: `${parent.source}>${local.source}`,
    ...(mergedData !== undefined ? { data: mergedData } : {}),
  };
}
