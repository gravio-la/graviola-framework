import {
  createDeleteRowEntry,
  defaultEntityActionRegistry,
} from "@graviola/edb-detail-renderer";
import type { EntityActionContext } from "@graviola/edb-detail-renderer-core";
import { createHostCapabilities } from "@graviola/edb-state-hooks";
import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";

import { resolveTableRowEntityActions } from "./resolveTableRowEntityActions";

const schema: JSONSchema7 = {
  type: "object",
  properties: { name: { type: "string" } },
};

function buildContext(
  typeName: string,
  targets: EntityActionContext["targets"],
): EntityActionContext {
  return {
    surface: "tableRow",
    density: "default",
    rootSchema: schema,
    typeName,
    typeIRI: `http://example.org/${typeName}`,
    targets,
    capabilities: createHostCapabilities(),
    dispatchIntent: async () => {},
    t: (key) => key,
  };
}

test("placeholder target does not resolve show or edit row actions", () => {
  const actions = resolveTableRowEntityActions({
    registry: [
      ...defaultEntityActionRegistry,
      createDeleteRowEntry(async () => {}),
    ],
    schema,
    buildContext: (targets) => buildContext("Item", targets),
    row: {
      entityIRI: "",
      typeName: "Item",
      typeIRI: "http://example.org/Item",
    },
    handlers: {
      dispatchIntent: () => {},
      showEntry: () => {},
      editEntry: () => {},
    },
  });
  const ids = actions.map((a) => a.id);
  expect(ids).not.toContain("show");
  expect(ids).not.toContain("edit");
  expect(ids).toContain("deleteRow");
});

test("concrete row target resolves show, edit, and delete", () => {
  const actions = resolveTableRowEntityActions({
    registry: [
      ...defaultEntityActionRegistry,
      createDeleteRowEntry(async () => {}),
    ],
    schema,
    buildContext: (targets) => buildContext("Item", targets),
    row: {
      entityIRI: "http://example.org/Item/1",
      typeName: "Item",
      typeIRI: "http://example.org/Item",
      data: { name: "One" },
    },
    handlers: {
      dispatchIntent: () => {},
      showEntry: () => {},
      editEntry: () => {},
    },
  });
  const ids = actions.map((a) => a.id);
  expect(ids).toContain("show");
  expect(ids).toContain("edit");
  expect(ids).toContain("deleteRow");
});
