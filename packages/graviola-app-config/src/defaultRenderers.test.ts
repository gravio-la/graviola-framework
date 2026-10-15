import { describe, expect, it } from "bun:test";
import { defaultRenderers } from "./defaultRenderers";
import { assetFieldTester } from "@graviola/asset-renderer";
import { imageUrlTester } from "@graviola/edb-basic-renderer";

describe("defaultRenderers", () => {
  it("registers asset and image URL renderers", () => {
    const testers = defaultRenderers.map((e) => e.tester);
    expect(testers).toContain(assetFieldTester);
    expect(testers).toContain(imageUrlTester);
  });
});
