import { describe, expect, it } from "bun:test";
import { imageUrlTester, IMAGE_URL_TESTER_RANK } from "./imageUrlTester";

describe("imageUrlTester", () => {
  it("matches uri format with image contentMediaType", () => {
    const uischema = { type: "Control", scope: "#/properties/icon" };
    expect(
      imageUrlTester(
        uischema,
        {
          type: "string",
          format: "uri",
          contentMediaType: "image/png",
        },
        undefined,
      ),
    ).toBe(IMAGE_URL_TESTER_RANK);
    expect(
      imageUrlTester(uischema, { type: "string", format: "uri" }, undefined),
    ).toBe(-1);
  });
});
