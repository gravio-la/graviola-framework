import { useCallback, useContext, useSyncExternalStore } from "react";
import type { RelationalInputMode } from "@graviola/semantic-jsonform-types";
import { AdbContext } from "./provider/adbContext";

export type { RelationalInputMode };

export const RELATIONAL_INPUT_STORAGE_KEY = "graviola.relationalInput";

const isMode = (v: unknown): v is RelationalInputMode =>
  v === "dropdown" || v === "finder";

function readStored(): RelationalInputMode | undefined {
  try {
    const v = globalThis.localStorage?.getItem(RELATIONAL_INPUT_STORAGE_KEY);
    return isMode(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

// Module-level store: all fields subscribe and update together.
let current: RelationalInputMode | undefined = readStored();
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => current;

/** Stored user preference (undefined when none). */
export const getRelationalInputPreference = getSnapshot;

/** Set (or with `undefined` clear) the user preference; persisted best-effort. */
export function setRelationalInputPreference(
  mode: RelationalInputMode | undefined,
): void {
  current = mode;
  try {
    if (mode)
      globalThis.localStorage?.setItem(RELATIONAL_INPUT_STORAGE_KEY, mode);
    else globalThis.localStorage?.removeItem(RELATIONAL_INPUT_STORAGE_KEY);
  } catch {
    /* storage unavailable: keep in-memory preference */
  }
  listeners.forEach((l) => l());
}

/** Test helper: re-read storage and notify. */
export function reloadRelationalInputPreference(): void {
  current = readStored();
  listeners.forEach((l) => l());
}

/**
 * Pure precedence: stored user preference, then app default, then "dropdown".
 * (An explicit per-field `dropdown` option beats all of these; see
 * {@link resolveRelationalInputMode}.)
 */
export function resolveRelationalInputMode(
  explicitDropdown: boolean | undefined,
  preference: RelationalInputMode | undefined,
  appDefault?: RelationalInputMode,
): RelationalInputMode {
  if (explicitDropdown === true) return "dropdown";
  if (explicitDropdown === false) return "finder";
  return preference ?? (isMode(appDefault) ? appDefault : "dropdown");
}

/**
 * Effective relational input mode (preference or app default) plus a setter
 * that persists the user's choice globally.
 */
export function useRelationalInputPreference(): [
  RelationalInputMode,
  (mode: RelationalInputMode) => void,
] {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const appDefault = useContext(AdbContext)?.relationalInputDefault;
  const mode = resolveRelationalInputMode(undefined, pref, appDefault);
  const setMode = useCallback(
    (m: RelationalInputMode) => setRelationalInputPreference(m),
    [],
  );
  return [mode, setMode];
}
