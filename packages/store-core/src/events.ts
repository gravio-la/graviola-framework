import type { EntityOf, SchemaRegistry } from "./registry";

export type ChangeType = "upsert" | "remove";

/**
 * Remove — no document payload. Discriminate with `changeType: "remove"` and `typeName`.
 */
export type EntityRemoveEvent<R extends SchemaRegistry = SchemaRegistry> = {
  [K in keyof R & string]: {
    entityIRI: string;
    changeType: "remove";
    typeIRI: string;
    typeName: K;
  };
}[keyof R & string];

/**
 * Upsert — optional embedded document, typed from the schema registry when `R` is known
 * (e.g. `z.infer` shapes). Use `typeName` to narrow.
 */
export type EntityUpsertEvent<R extends SchemaRegistry = SchemaRegistry> = {
  [K in keyof R & string]: {
    entityIRI: string;
    changeType: "upsert";
    typeIRI: string;
    typeName: K;
    data?: EntityOf<R, K>;
  };
}[keyof R & string];

/**
 * Discriminated union: `changeType` → remove (no `data`) vs upsert (optional `data`).
 * When `R` maps type names to entity shapes, `typeName` further narrows `data`.
 */
export type EntityChangeEvent<R extends SchemaRegistry = SchemaRegistry> =
  | EntityRemoveEvent<R>
  | EntityUpsertEvent<R>;

export type ChangeListener<R extends SchemaRegistry = SchemaRegistry> = (
  event: EntityChangeEvent<R>,
) => void;

export type Unsubscribe = () => void;

/** Lightweight pub/sub — no DOM / React */
export function createChangeBus<R extends SchemaRegistry = SchemaRegistry>() {
  const listeners = new Set<ChangeListener<R>>();
  return {
    subscribe(listener: ChangeListener<R>): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event: EntityChangeEvent<R>): void {
      listeners.forEach((l) => l(event));
    },
  };
}
