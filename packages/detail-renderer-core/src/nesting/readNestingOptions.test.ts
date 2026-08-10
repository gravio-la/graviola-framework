import { describe, expect, test } from "bun:test";
import type { UISchemaElement } from "@jsonforms/core";

import { childNestingContext, readNestingOptions } from "./readNestingOptions";
import type { DetailTesterContext } from "../types";

describe("readNestingOptions", () => {
  test("uiSchema options win over inherited ctx", () => {
    const ctx: DetailTesterContext = {
      rootSchema: {},
      depth: 0,
      maxDepth: 6,
      nesting: { collapsible: false, defaultExpanded: false },
    };
    const ui = {
      type: "Group",
      options: { nesting: { collapsible: true, defaultExpanded: true } },
    } as UISchemaElement;
    expect(readNestingOptions(ui, ctx)).toEqual({
      collapsible: true,
      defaultExpanded: true,
    });
  });

  test("article presentation forces collapsible off unless overridden", () => {
    const ctx: DetailTesterContext = {
      rootSchema: {},
      depth: 0,
      maxDepth: 6,
      presentation: "article",
      nesting: { collapsible: true },
    };
    const ui = { type: "Group" } as UISchemaElement;
    expect(readNestingOptions(ui, ctx).collapsible).toBe(false);

    const forceUi = {
      type: "Group",
      options: {
        nesting: { collapsible: true, forceCollapsibleInArticle: true },
      },
    } as UISchemaElement;
    expect(readNestingOptions(forceUi, ctx).collapsible).toBe(true);
  });

  test("childNestingContext does not mutate parent", () => {
    const parent: DetailTesterContext = {
      rootSchema: {},
      depth: 0,
      maxDepth: 6,
      nesting: { collapsible: false },
    };
    const ui = {
      type: "Group",
      options: { nesting: { collapsible: true } },
    } as UISchemaElement;
    const child = childNestingContext(ui, parent);
    expect(child.nesting?.collapsible).toBe(true);
    expect(parent.nesting?.collapsible).toBe(false);
  });
});
