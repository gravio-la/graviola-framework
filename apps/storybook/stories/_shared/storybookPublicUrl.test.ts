import { afterEach, describe, expect, test } from "bun:test";

import {
  storybookPublicBasePath,
  storybookPublicUrl,
} from "./storybookPublicUrl";

const originalEnv = {
  ...(import.meta as { env?: Record<string, string> }).env,
};

function setImportMetaEnv(values: Record<string, string | undefined>) {
  Object.assign(
    (import.meta as { env: Record<string, string | undefined> }).env,
    values,
  );
}

afterEach(() => {
  setImportMetaEnv(originalEnv);
});

describe("storybookPublicBasePath", () => {
  test("prefers STORYBOOK_BASE_PATH", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: "/graviola-framework/storybook/",
      VITE_BASE_PATH: "/ignored",
    });
    expect(storybookPublicBasePath()).toBe("/graviola-framework/storybook");
  });

  test("falls back to VITE_BASE_PATH", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: undefined,
      VITE_BASE_PATH: "/graviola-framework/storybook",
    });
    expect(storybookPublicBasePath()).toBe("/graviola-framework/storybook");
  });

  test("empty in local dev", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: undefined,
      VITE_BASE_PATH: undefined,
    });
    expect(storybookPublicBasePath()).toBe("");
  });
});

describe("storybookPublicUrl", () => {
  test("prefixes fixture path for GitHub Pages", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: "/graviola-framework/storybook",
    });
    expect(storybookPublicUrl("/fixtures/bach-portrait.jpg")).toBe(
      "/graviola-framework/storybook/fixtures/bach-portrait.jpg",
    );
  });

  test("root-relative in local dev", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: undefined,
      VITE_BASE_PATH: undefined,
    });
    expect(storybookPublicUrl("/fixtures/fuga.ogg")).toBe("/fixtures/fuga.ogg");
  });

  test("accepts paths without leading slash", () => {
    setImportMetaEnv({
      STORYBOOK_BASE_PATH: "/graviola-framework/storybook",
    });
    expect(storybookPublicUrl("fixtures/violin.jpg")).toBe(
      "/graviola-framework/storybook/fixtures/violin.jpg",
    );
  });
});
