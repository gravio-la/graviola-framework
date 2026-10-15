import { describe, expect, test } from "bun:test";

import { contentDispositionHeader } from "./contentDisposition.js";

describe("contentDispositionHeader", () => {
  test("RFC 5987 filename for CJK", () => {
    const header = contentDispositionHeader("图片.png", true);
    expect(header).toContain('filename="');
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain("%E5%9B%BE");
  });
});
