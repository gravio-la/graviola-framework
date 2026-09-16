import { describe, expect, test } from "bun:test";

import {
  mappingStrategyCatalog,
  mappingStrategyIds,
} from "./mappingStrategyCatalog";

describe("mappingStrategyCatalog", () => {
  test("covers every id in strategyFunctionMap and nothing else", () => {
    const catalogIds = mappingStrategyCatalog.map((e) => e.id).sort();
    expect(catalogIds).toEqual(mappingStrategyIds());
  });

  test("ids are unique", () => {
    const ids = mappingStrategyCatalog.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
