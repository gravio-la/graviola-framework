import { afterEach, describe, expect, test } from "bun:test";
import {
  RELATIONAL_INPUT_STORAGE_KEY,
  getRelationalInputPreference,
  reloadRelationalInputPreference,
  resolveRelationalInputMode,
  setRelationalInputPreference,
} from "./useRelationalInputPreference";

const g = globalThis as any;
const original = Object.getOwnPropertyDescriptor(g, "localStorage");

function mockStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  g.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
  return store;
}

function throwingStorage() {
  const boom = () => {
    throw new Error("denied");
  };
  g.localStorage = { getItem: boom, setItem: boom, removeItem: boom };
}

// what useRelationalInputPreference() returns for a field without explicit option
const effective = (appDefault?: "dropdown" | "finder") =>
  resolveRelationalInputMode(
    undefined,
    getRelationalInputPreference(),
    appDefault,
  );

afterEach(() => {
  setRelationalInputPreference(undefined);
  if (original) Object.defineProperty(g, "localStorage", original);
  else delete g.localStorage;
});

describe("relational input preference store", () => {
  test("defaults to dropdown without preference or app default", () => {
    mockStorage();
    reloadRelationalInputPreference();
    expect(effective()).toBe("dropdown");
  });

  test("app default applies when no preference is stored", () => {
    mockStorage();
    reloadRelationalInputPreference();
    expect(effective("finder")).toBe("finder");
  });

  test("user preference beats app default and is persisted", () => {
    const store = mockStorage();
    setRelationalInputPreference("finder");
    expect(store[RELATIONAL_INPUT_STORAGE_KEY]).toBe("finder");
    expect(effective("dropdown")).toBe("finder");
  });

  test("reads a stored preference and ignores invalid values", () => {
    mockStorage({ [RELATIONAL_INPUT_STORAGE_KEY]: "finder" });
    reloadRelationalInputPreference();
    expect(effective()).toBe("finder");
    mockStorage({ [RELATIONAL_INPUT_STORAGE_KEY]: "bogus" });
    reloadRelationalInputPreference();
    expect(effective()).toBe("dropdown");
  });

  test("works with throwing storage (in-memory only)", () => {
    throwingStorage();
    expect(() => reloadRelationalInputPreference()).not.toThrow();
    expect(() => setRelationalInputPreference("finder")).not.toThrow();
    expect(effective()).toBe("finder");
  });

  test("works when localStorage is absent", () => {
    delete g.localStorage;
    expect(() => setRelationalInputPreference("finder")).not.toThrow();
    expect(effective()).toBe("finder");
  });
});

describe("resolveRelationalInputMode precedence", () => {
  test("explicit dropdown option beats preference and app default", () => {
    expect(resolveRelationalInputMode(true, "finder", "finder")).toBe(
      "dropdown",
    );
    expect(resolveRelationalInputMode(false, "dropdown", "dropdown")).toBe(
      "finder",
    );
  });
  test("preference, then app default, then dropdown", () => {
    expect(resolveRelationalInputMode(undefined, "finder", "dropdown")).toBe(
      "finder",
    );
    expect(resolveRelationalInputMode(undefined, undefined, "finder")).toBe(
      "finder",
    );
    expect(resolveRelationalInputMode(undefined, undefined, undefined)).toBe(
      "dropdown",
    );
  });
});
