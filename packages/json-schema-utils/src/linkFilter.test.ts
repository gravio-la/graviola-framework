import { describe, expect, it } from "bun:test";
import {
  mergeLinkFilters,
  resolveLinkFilterWhere,
  type LinkFilter,
} from "./linkFilter";

describe("resolveLinkFilterWhere", () => {
  it("resolves $data paths from root form data", () => {
    const filter: LinkFilter = {
      where: { tier: { equals: { $data: "host.tier" } } },
    };
    const result = resolveLinkFilterWhere(filter, {
      host: { tier: "gold" },
    });
    expect(result.unresolved).toBe(false);
    expect(result.where).toEqual({ tier: { equals: "gold" } });
  });

  it("drops clauses with unresolved $data when onUnresolved is ignore", () => {
    const filter: LinkFilter = {
      where: {
        tier: { equals: { $data: "host.tier" } },
        active: { equals: true },
      },
    };
    const result = resolveLinkFilterWhere(filter, { active: true });
    expect(result.unresolved).toBe(false);
    expect(result.where).toEqual({ active: { equals: true } });
  });

  it("signals unresolved when onUnresolved is empty", () => {
    const filter: LinkFilter = {
      onUnresolved: "empty",
      where: { tier: { equals: { $data: "host.tier" } } },
    };
    const result = resolveLinkFilterWhere(filter, {});
    expect(result.unresolved).toBe(true);
    expect(result.where).toBeUndefined();
  });

  it("prunes AND branches that become empty", () => {
    const filter: LinkFilter = {
      where: {
        AND: [
          { tier: { equals: { $data: "missing" } } },
          { name: { contains: "ann" } },
        ],
      },
    };
    const result = resolveLinkFilterWhere(filter, {});
    expect(result.where).toEqual({
      AND: [{ name: { contains: "ann" } }],
    });
  });
});

describe("mergeLinkFilters", () => {
  it("lets override replace base by default", () => {
    const base: LinkFilter = { where: { a: 1 } };
    const override: LinkFilter = { where: { b: 2 } };
    expect(mergeLinkFilters(base, override)).toEqual({
      where: { b: 2 },
    });
  });

  it("combines with AND when mode is and", () => {
    const base: LinkFilter = { where: { a: 1 } };
    const override: LinkFilter = { where: { b: 2 }, mode: "and" };
    expect(mergeLinkFilters(base, override)?.where).toEqual({
      AND: [{ a: 1 }, { b: 2 }],
    });
  });
});
