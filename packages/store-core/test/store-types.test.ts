import { describe, expect, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import type {
  BaseStore,
  EntityChangeEvent,
  MinimalLookupStore,
  ReadOnlyStructuralStore,
  SparqlStore,
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
});
