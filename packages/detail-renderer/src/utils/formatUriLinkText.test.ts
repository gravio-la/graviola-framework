import { describe, expect, it } from "bun:test";

import { formatUriLinkText } from "./formatUriLinkText";

describe("formatUriLinkText", () => {
  it("uses explicit label when provided", () => {
    expect(
      formatUriLinkText("https://example.org/path/id=65648", "Quelle"),
    ).toBe("Quelle");
  });

  it("shows host and path hint instead of opaque last segment", () => {
    const text = formatUriLinkText(
      "https://www.ploetzblog.de/recipes?id=65648c9147807249769bcd85",
    );
    expect(text).toContain("www.ploetzblog.de");
    expect(text).not.toBe("id=65648c9147807249769bcd85");
  });

  it("shows host only for bare origin URLs", () => {
    expect(formatUriLinkText("https://example.org/")).toBe("example.org");
  });
});
