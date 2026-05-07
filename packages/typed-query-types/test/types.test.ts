/**
 * Type-level contract tests for typed-query-types.
 *
 * These use `expect-type` (compile-time) and `@ts-expect-error` (must-not-compile),
 * not runtime expectations about computed behaviour.
 */
import { describe, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import type {
  FilterOperatorsForType,
  StringFilterOperators,
  TypedWhereInput,
  TypedGraphTraversalFilterOptions,
} from "../src/index";
import { z } from "zod";

describe("typed-query-types (types)", () => {
  test("FilterOperatorsForType distributes union: string | number field accepts both operator families", () => {
    type U = { x: string | number };
    type Wx = TypedWhereInput<U>["x"];

    const stringFilters: Wx = {
      contains: "a",
      startsWith: "b",
      mode: "insensitive",
    };
    const numberFilters: Wx = { gte: 1, lte: 10, in: [1, 2] };
    const plainString: Wx = "literal";

    expectTypeOf(stringFilters).toExtend<Wx>();
    expectTypeOf(numberFilters).toExtend<Wx>();
    expectTypeOf(plainString).toExtend<Wx>();
  });

  test("FilterOperatorsForType<any> degrades to permissive any", () => {
    type AnyWhere = FilterOperatorsForType<any>;
    expectTypeOf<any>().toExtend<AnyWhere>();
    const opaque: AnyWhere = {} as AnyWhere;
    expectTypeOf(opaque).toEqualTypeOf<AnyWhere>();
  });

  test("TypedWhereInput<Person> accepts valid operators for z.infer schema", () => {
    const PersonSchema = z.object({ name: z.string(), age: z.number() });
    type Person = z.infer<typeof PersonSchema>;

    const where: TypedWhereInput<Person> = {
      name: { startsWith: "A", mode: "insensitive" },
      age: { gte: 18, lt: 99 },
      AND: [{ name: { equals: "x" } }],
    };

    expectTypeOf(where).toExtend<TypedWhereInput<Person>>();
    expectTypeOf(where.name).toEqualTypeOf<
      string | StringFilterOperators | undefined
    >();
  });

  test("nested relationship where — array of objects with @id", () => {
    type Child = { "@id": string; label: string };
    type Parent = { children: Child[] };

    const where: TypedWhereInput<Parent> = {
      children: { some: { label: { startsWith: "a" } } },
    };

    expectTypeOf(where).toExtend<TypedWhereInput<Parent>>();
  });

  test("recursive lazy Zod infer — filter root fields without deep optional breakage", () => {
    const Node: z.ZodType<{ id: string; children: unknown[] }> = z.lazy(() =>
      z.object({
        id: z.string(),
        children: z.array(Node),
      }),
    );
    type NodeT = z.infer<typeof Node>;

    const opts: TypedGraphTraversalFilterOptions<NodeT> = {
      where: { id: { equals: "root" } },
    };

    expectTypeOf(opts).toExtend<TypedGraphTraversalFilterOptions<NodeT>>();
  });

  test("invalid where shapes are rejected by the type checker", () => {
    type Person = { age: number };

    const _bad: TypedWhereInput<Person> = {
      age: {
        // @ts-expect-error — `contains` is not part of NumberFilterOperators
        contains: "oops",
      },
    };
    void _bad;
  });
});
