import { describe, expect, test } from "bun:test";
import { SemanticTable } from "@graviola/edb-table-components";

describe("jsonld table integration", () => {
  test("semantic table component is available", () => {
    expect(SemanticTable).toBeDefined();
  });
});
