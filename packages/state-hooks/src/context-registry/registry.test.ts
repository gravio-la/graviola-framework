import { describe, expect, mock, test } from "bun:test";
import {
  listGraviolaContexts,
  registerGraviolaContext,
  resolveGraviolaContext,
} from "./registry";
import type { ContextDescriptor } from "./types";

const stubCrud = {
  crudOptions: null,
  dataStore: null,
  isReady: true,
} satisfies ContextDescriptor["crud"];

function uniqueIri(prefix: string): string {
  return `urn:test:context:${prefix}:${crypto.randomUUID()}`;
}

describe("GraviolaContextRegistry", () => {
  test("register, resolve, and deregister", () => {
    const iri = uniqueIri("lifecycle");
    const descriptor: ContextDescriptor = {
      crud: stubCrud,
      label: "Review staging",
    };

    const deregister = registerGraviolaContext(iri, descriptor);
    expect(resolveGraviolaContext(iri)).toEqual(descriptor);
    expect(listGraviolaContexts()).toEqual([{ iri, ...descriptor }]);

    deregister();
    expect(listGraviolaContexts()).toEqual([]);
  });

  test("warns on duplicate registration", () => {
    const warnSpy = mock(() => {});
    const originalWarn = console.warn;
    console.warn = warnSpy as typeof console.warn;

    try {
      const iri = uniqueIri("duplicate");
      const descriptor: ContextDescriptor = {
        crud: stubCrud,
        label: "First",
      };

      registerGraviolaContext(iri, descriptor);
      const deregister = registerGraviolaContext(iri, {
        ...descriptor,
        label: "Second",
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
        "duplicate registration",
      );
      expect(resolveGraviolaContext(iri)?.label).toBe("Second");

      deregister();
    } finally {
      console.warn = originalWarn;
    }
  });

  test("warns when resolving unknown IRI and lists registered IRIs", () => {
    const warnSpy = mock(() => {});
    const originalWarn = console.warn;
    console.warn = warnSpy as typeof console.warn;

    try {
      const known = uniqueIri("known");
      const deregister = registerGraviolaContext(known, {
        crud: stubCrud,
        label: "Known",
      });

      expect(resolveGraviolaContext(uniqueIri("missing"))).toBeUndefined();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0]?.[0]);
      expect(message).toContain("unknown context IRI");
      expect(message).toContain(known);

      deregister();
    } finally {
      console.warn = originalWarn;
    }
  });

  test("deregister is idempotent and only removes own descriptor", () => {
    const iri = uniqueIri("idempotent");
    const first: ContextDescriptor = { crud: stubCrud, label: "v1" };
    const second: ContextDescriptor = { crud: stubCrud, label: "v2" };

    const deregisterFirst = registerGraviolaContext(iri, first);
    const deregisterSecond = registerGraviolaContext(iri, second);
    deregisterFirst();

    expect(resolveGraviolaContext(iri)?.label).toBe("v2");

    deregisterSecond();
    expect(listGraviolaContexts()).toEqual([]);
  });
});
