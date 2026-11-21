import { describe, expect, test } from "bun:test";

import { showsSimilarityFinderToggle } from "./similarityFinderVisibility";

describe("showsSimilarityFinderToggle", () => {
  test("shown for the form that owns the global search path", () => {
    expect(
      showsSimilarityFinderToggle({ formsPath: "root", globalPath: "root" }),
    ).toBe(true);
  });

  test("hidden for other forms", () => {
    expect(
      showsSimilarityFinderToggle({
        formsPath: "root",
        globalPath: "root.host",
      }),
    ).toBe(false);
  });

  test("hidden for forms without a formsPath, even before any path was set", () => {
    expect(showsSimilarityFinderToggle({})).toBe(false);
    expect(showsSimilarityFinderToggle({ globalPath: "root" })).toBe(false);
  });

  test("a form that has not been focused yet does not claim the unset global path", () => {
    expect(
      showsSimilarityFinderToggle({ formsPath: "root", globalPath: undefined }),
    ).toBe(false);
  });
});
