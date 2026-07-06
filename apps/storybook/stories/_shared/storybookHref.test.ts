import { describe, expect, test } from "bun:test";

import {
  extractStorybookPathQuery,
  isStorybookInternalHref,
  resolveStorybookManagerHref,
  storybookHref,
  storybookPathQuery,
} from "./storybookHref";

describe("storybookPathQuery", () => {
  test("docs entry uses ./?path=/docs/", () => {
    expect(storybookPathQuery("structural-dispatch-overview--docs")).toBe(
      "./?path=/docs/structural-dispatch-overview--docs",
    );
  });

  test("story entry uses ./?path=/story/", () => {
    expect(storybookPathQuery("semantic-views-semanticcard--default")).toBe(
      "./?path=/story/semantic-views-semanticcard--default",
    );
  });

  test("appends hash", () => {
    expect(storybookPathQuery("foo--docs", "#section")).toBe(
      "./?path=/docs/foo--docs#section",
    );
  });
});

describe("storybookHref", () => {
  test("matches storybookPathQuery", () => {
    expect(storybookHref("welcome--docs")).toBe("./?path=/docs/welcome--docs");
  });
});

describe("extractStorybookPathQuery", () => {
  test("bare query", () => {
    expect(extractStorybookPathQuery("?path=/docs/foo--docs")).toBe(
      "?path=/docs/foo--docs",
    );
  });

  test("./ prefix", () => {
    expect(extractStorybookPathQuery("./?path=/docs/foo--docs")).toBe(
      "?path=/docs/foo--docs",
    );
  });

  test("legacy index.html", () => {
    expect(
      extractStorybookPathQuery("./index.html?path=/docs/foo--docs#x"),
    ).toBe("?path=/docs/foo--docs#x");
  });

  test("non-storybook href", () => {
    expect(extractStorybookPathQuery("/docs/external")).toBeNull();
  });
});

describe("isStorybookInternalHref", () => {
  test("recognizes internal variants", () => {
    expect(isStorybookInternalHref("?path=/docs/a--docs")).toBe(true);
    expect(isStorybookInternalHref("./?path=/story/b--default")).toBe(true);
    expect(isStorybookInternalHref("./index.html?path=/docs/a--docs")).toBe(
      true,
    );
  });

  test("rejects external and anchors", () => {
    expect(isStorybookInternalHref("https://example.com")).toBe(false);
    expect(isStorybookInternalHref("#section")).toBe(false);
  });
});

describe("resolveStorybookManagerHref", () => {
  const ghPagesIframe = {
    origin: "https://gravio-la.github.io",
    pathname: "/graviola-framework/storybook/iframe.html",
  };

  const ghPagesManager = {
    origin: "https://gravio-la.github.io",
    pathname: "/graviola-framework/storybook/",
  };

  const localIframe = {
    origin: "http://localhost:6006",
    pathname: "/iframe.html",
  };

  test("from iframe: bare ?path=", () => {
    expect(
      resolveStorybookManagerHref(
        "?path=/docs/structural-dispatch-overview--docs",
        ghPagesIframe,
      ),
    ).toBe(
      "https://gravio-la.github.io/graviola-framework/storybook/?path=/docs/structural-dispatch-overview--docs",
    );
  });

  test("from iframe: ./?path=", () => {
    expect(
      resolveStorybookManagerHref(
        "./?path=/docs/structural-dispatch-overview--docs",
        ghPagesIframe,
      ),
    ).toBe(
      "https://gravio-la.github.io/graviola-framework/storybook/?path=/docs/structural-dispatch-overview--docs",
    );
  });

  test("from manager shell", () => {
    expect(
      resolveStorybookManagerHref(
        "./?path=/docs/welcome--docs",
        ghPagesManager,
      ),
    ).toBe(
      "https://gravio-la.github.io/graviola-framework/storybook/?path=/docs/welcome--docs",
    );
  });

  test("local dev iframe", () => {
    expect(
      resolveStorybookManagerHref("?path=/story/foo--default", localIframe),
    ).toBe("http://localhost:6006/?path=/story/foo--default");
  });

  test("preserves hash", () => {
    expect(
      resolveStorybookManagerHref(
        "./?path=/docs/foo--docs#section",
        ghPagesIframe,
      ),
    ).toBe(
      "https://gravio-la.github.io/graviola-framework/storybook/?path=/docs/foo--docs#section",
    );
  });

  test("passes through external href", () => {
    expect(
      resolveStorybookManagerHref("https://example.com/page", ghPagesIframe),
    ).toBe("https://example.com/page");
  });
});
