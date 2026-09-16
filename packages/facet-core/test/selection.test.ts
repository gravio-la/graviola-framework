import { describe, expect, test } from "bun:test";

import {
  activeCount,
  clearAll,
  emptySelection,
  toggleTerm,
} from "../src/selection";

describe("facet selection", () => {
  const scope = "#/definitions/Manifestation/properties/mimeType";

  test("toggleTerm multi", () => {
    let sel = emptySelection();
    sel = toggleTerm(sel, scope, "image/jpeg");
    sel = toggleTerm(sel, scope, "image/png");
    expect(activeCount(sel)).toBe(2);
    sel = toggleTerm(sel, scope, "image/jpeg");
    expect(activeCount(sel)).toBe(1);
  });

  test("clearAll", () => {
    let sel = toggleTerm(emptySelection(), scope, "a");
    sel = clearAll();
    expect(activeCount(sel)).toBe(0);
  });
});
