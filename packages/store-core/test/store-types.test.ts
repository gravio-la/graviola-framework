import { describe, expect, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import {
  hasCapability,
  hasCapabilityInDescriptor,
  type BaseStore,
  type CapabilityDescriptor,
  type Counts,
  type EntityChangeEvent,
  type MinimalLookupStore,
  type ReadOnlyStructuralStore,
  type SchemaRegistry,
  type SparqlStore,
  type StoreId,
} from "../src/index";

type Wiki = { "@id": string; label: string };
type Rwiki = { Concept: Wiki };

describe("store paper scenarios (types)", () => {
  test("BaseStore + MinimalLookupStore expose identifies + loads + searches", () => {
    type M = MinimalLookupStore<Rwiki>;
    expectTypeOf<M>().toMatchTypeOf<BaseStore<Rwiki>>();
    expectTypeOf<M>().toHaveProperty("searchByLabel");
    expect(true).toBe(true);
  });

  test("ReadOnlyStructuralStore has list/filter without upsert", () => {
    type Ro = ReadOnlyStructuralStore<Rwiki>;
    expectTypeOf<Ro>().toHaveProperty("list");
    expectTypeOf<Ro>().toHaveProperty("filterMany");
    expect(true).toBe(true);
  });

  test("SparqlStore requires upsert + nativeQuery", () => {
    type S = SparqlStore<Rwiki>;
    expectTypeOf<S["upsert"]>().toBeFunction();
    expectTypeOf<S["nativeQuery"]>().toBeFunction();
    expect(true).toBe(true);
  });

  test("EntityChangeEvent<R> narrows by changeType and typeName", () => {
    const handle = (e: EntityChangeEvent<Rwiki>) => {
      if (e.changeType === "remove") {
        expectTypeOf(e.typeName).toEqualTypeOf<"Concept">();
        return;
      }
      if (e.typeName === "Concept") {
        expectTypeOf(e.data).toEqualTypeOf<Wiki | undefined>();
      }
    };
    expectTypeOf(handle).toBeFunction();
  });

  test("hasCapabilityInDescriptor reads descriptor flags", () => {
    const d: CapabilityDescriptor = { identifies: true, counts: true };
    expect(hasCapabilityInDescriptor(d, "identifies")).toBe(true);
    expect(hasCapabilityInDescriptor(d, "counts")).toBe(true);
    expect(hasCapabilityInDescriptor(d, "imports")).toBe(false);
  });

  test("hasCapability narrows optional Counts into required count", () => {
    type R = SchemaRegistry;
    const store = {
      storeId: "x" as StoreId,
      capabilities: {
        identifies: true,
        counts: true,
      } satisfies CapabilityDescriptor,
      typeNameToTypeIRI: (_n: string) => "",
      typeIRItoTypeName: (_iri: string) => "",
    } as BaseStore<R> & Partial<Counts<R>>;

    expectTypeOf(store.count).toEqualTypeOf<Counts<R>["count"] | undefined>();

    if (hasCapability(store, "counts")) {
      expectTypeOf(store.count).toEqualTypeOf<Counts<R>["count"]>();
    }
  });
});
