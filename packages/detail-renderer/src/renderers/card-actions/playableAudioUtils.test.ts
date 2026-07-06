import { describe, expect, it } from "bun:test";

import { resolveAudioUrl, sameAudioUrl } from "./playableAudioUtils";

const BASE =
  "https://gravio-la.github.io/graviola-framework/storybook/index.html";

describe("playableAudioUtils", () => {
  it("resolves relative paths against a base URL", () => {
    expect(
      resolveAudioUrl("/graviola-framework/storybook/fixtures/fuga.ogg", BASE),
    ).toBe(
      "https://gravio-la.github.io/graviola-framework/storybook/fixtures/fuga.ogg",
    );
  });

  it("treats relative and absolute URLs as the same source", () => {
    const relative = "/graviola-framework/storybook/fixtures/fuga.ogg";
    const absolute =
      "https://gravio-la.github.io/graviola-framework/storybook/fixtures/fuga.ogg";
    expect(sameAudioUrl(relative, absolute, BASE)).toBe(true);
  });

  it("detects different audio sources", () => {
    expect(
      sameAudioUrl(
        "/fixtures/a.ogg",
        "/fixtures/b.ogg",
        "https://example.com/page",
      ),
    ).toBe(false);
  });
});
