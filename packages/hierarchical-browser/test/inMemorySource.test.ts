import { describe, expect, test } from "bun:test";

import { composeChildrenFirst } from "../src/composeChildrenFirst";
import { createFilterManyChildrenSource } from "../src/createFilterManyChildrenSource";
import type { ChildrenListingSource } from "../src/types";
import {
  applyHierarchicalBrowseParams,
  parseHierarchicalBrowseParams,
} from "../src/browseParams";
import { parseSortParam, sortDocuments } from "../src/sortDocuments";

type Node = {
  "@id": string;
  label: string;
  parent?: { "@id": string };
  size?: number;
};

function createInMemorySource(nodes: Node[]): ChildrenListingSource<Node> {
  const list = async (
    predicate: (n: Node) => boolean,
    opts?: {
      limit?: number;
      offset?: number;
      sort?: { field: string; desc?: boolean }[];
    },
  ) => {
    let docs = nodes.filter(predicate);
    docs = sortDocuments(docs, opts?.sort, {
      name: "label",
      size: "size",
    });
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit;
    const page =
      limit != null ? docs.slice(offset, offset + limit) : docs.slice(offset);
    return {
      documents: page,
      estimatedTotalHits: docs.length,
      hasMore: limit != null ? offset + page.length < docs.length : false,
    };
  };

  return {
    listRoots: (opts) => list((n) => n.parent == null, opts),
    listChildren: (parentId, opts) =>
      list((n) => n.parent?.["@id"] === parentId, opts),
  };
}

describe("in-memory ChildrenListingSource smoke", () => {
  const nodes: Node[] = [
    { "@id": "iri:root", label: "Root", size: 0 },
    { "@id": "iri:a", label: "Alpha", parent: { "@id": "iri:root" }, size: 10 },
    { "@id": "iri:b", label: "Beta", parent: { "@id": "iri:root" }, size: 30 },
    {
      "@id": "iri:c",
      label: "child-of-a",
      parent: { "@id": "iri:a" },
      size: 5,
    },
  ];

  test("lists roots and children", async () => {
    const source = createInMemorySource(nodes);
    const roots = await source.listRoots();
    expect(roots.documents.map((d) => d["@id"])).toEqual(["iri:root"]);

    const children = await source.listChildren("iri:root", {
      sort: [{ field: "name" }],
    });
    expect(children.documents.map((d) => d.label)).toEqual(["Alpha", "Beta"]);
  });

  test("composeChildrenFirst puts containers before members", async () => {
    const containers = async () => ({
      documents: [{ "@id": "c1", label: "folder" }],
      estimatedTotalHits: 1,
    });
    const members = async () => ({
      documents: [{ "@id": "m1", label: "file" }],
      estimatedTotalHits: 1,
    });
    const result = await composeChildrenFirst(containers, members);
    expect(result.documents.map((d) => d["@id"])).toEqual(["c1", "m1"]);
  });
});

describe("createFilterManyChildrenSource", () => {
  const docs: Node[] = [
    { "@id": "iri:root", label: "Root" },
    { "@id": "iri:a", label: "Alpha", parent: { "@id": "iri:root" }, size: 2 },
    { "@id": "iri:b", label: "Beta", parent: { "@id": "iri:root" }, size: 1 },
  ];

  const store = {
    async filterMany(
      _typeName: string,
      options?: { where?: Record<string, unknown>; limit?: number },
    ) {
      const where = options?.where ?? {};
      const parentClause = where.parent as
        | { equals?: { "@id": string }; none?: unknown }
        | undefined;

      let matched: Node[];
      if (parentClause?.none !== undefined) {
        matched = docs.filter((d) => d.parent == null);
      } else if (parentClause?.equals?.["@id"]) {
        const pid = parentClause.equals["@id"];
        matched = docs.filter((d) => d.parent?.["@id"] === pid);
      } else {
        matched = [...docs];
      }
      const cap = options?.limit ?? matched.length;
      return matched.slice(0, cap) as Record<string, unknown>[];
    },
  };

  test("children use @id equals; client sort + post-fetch limit", async () => {
    const source = createFilterManyChildrenSource({
      store,
      typeName: "Node",
      parentField: "parent",
      sortFieldMap: { name: "label", size: "size" },
    });

    const page = await source.listChildren("iri:root", {
      sort: [{ field: "size", desc: true }],
      limit: 1,
    });
    expect(page.documents).toHaveLength(1);
    expect((page.documents[0] as Node).label).toBe("Alpha");
    expect(page.hasMore).toBe(true);
    expect(page.estimatedTotalHits).toBe(2);
  });

  test("rootsMode absentParent uses none where", async () => {
    const source = createFilterManyChildrenSource({
      store,
      typeName: "Node",
      parentField: "parent",
      rootsMode: "absentParent",
    });
    const roots = await source.listRoots();
    expect(roots.documents.map((d) => (d as Node)["@id"])).toEqual([
      "iri:root",
    ]);
  });
});

describe("browse params + sort helpers", () => {
  test("parse and apply URL params", () => {
    const params = new URLSearchParams(
      "root=iri%3Ar&selected=iri%3As&view=table&sort=name%3Aasc",
    );
    const parsed = parseHierarchicalBrowseParams(params);
    expect(parsed).toEqual({
      root: "iri:r",
      selected: "iri:s",
      view: "table",
      sort: "name:asc",
    });
    expect(parseSortParam(parsed.sort)).toEqual([
      { field: "name", desc: false },
    ]);

    const next = applyHierarchicalBrowseParams(params, {
      selected: "iri:other",
      sort: null,
    });
    expect(next.get("selected")).toBe("iri:other");
    expect(next.get("sort")).toBeNull();
    expect(next.get("root")).toBe("iri:r");
  });

  test("selectedAlias is read then cleared on write", () => {
    const params = new URLSearchParams("dir=iri%3Alegacy");
    const parsed = parseHierarchicalBrowseParams(params, {
      selectedAlias: "dir",
    });
    expect(parsed.selected).toBe("iri:legacy");
    const next = applyHierarchicalBrowseParams(
      params,
      { selected: "iri:new" },
      { selectedAlias: "dir" },
    );
    expect(next.get("selected")).toBe("iri:new");
    expect(next.get("dir")).toBeNull();
  });
});
