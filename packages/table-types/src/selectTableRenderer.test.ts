import { describe, expect, test } from "bun:test";
import { selectTableRenderer, type TableColumnRegistry } from "./index";

describe("selectTableRenderer", () => {
  test("prefers rendererHint match", () => {
    const registry: TableColumnRegistry = [
      {
        name: "fallback",
        tester: () => 1,
        renderer: () => ({}),
      },
      {
        name: "hinted",
        tester: () => -1,
        renderer: () => ({ id: "hinted" }),
      },
    ];

    const selected = selectTableRenderer(
      registry,
      { type: "string" } as any,
      "#/properties/name",
      { scope: "#/properties/name", rendererHint: "hinted" },
      { rootSchema: {} as any, typeName: "Item", rowShape: "jsonld" },
    );

    expect(selected?.name).toBe("hinted");
  });
});
