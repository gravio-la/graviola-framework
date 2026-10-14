import { describe, expect, test } from "bun:test";
import {
  composeInlineArrayElementLabel,
  formatInlineArrayElementLabelValue,
} from "./inlineArrayElementLabel";

describe("composeInlineArrayElementLabel", () => {
  test("joins non-empty props in order with spaces", () => {
    const data = {
      zutatRef: {
        "@id": "http://example.org/z/1",
        label: "Roggenvollkornmehl",
      },
      zutatFreitext: "",
      menge: 512,
      einheit: "g",
    };
    expect(
      composeInlineArrayElementLabel(data, [
        "zutatRef",
        "zutatFreitext",
        "menge",
        "einheit",
      ]),
    ).toBe("Roggenvollkornmehl 512 g");
  });

  test("uses ref object label fields and skips empties", () => {
    expect(
      formatInlineArrayElementLabelValue({
        __label: "Spelt flour",
        "@id": "http://ex/id/spelt",
      }),
    ).toBe("Spelt flour");
    expect(
      composeInlineArrayElementLabel(
        { zutatRef: { "@id": "http://example.org/items/Roggen#mehl" } },
        ["zutatRef"],
      ),
    ).toBe("mehl");
  });

  test("truncates long composed labels", () => {
    const long = "a".repeat(80);
    const result = composeInlineArrayElementLabel(
      { a: long, b: "tail" },
      ["a", "b"],
      { maxLength: 60 },
    );
    expect(result).toBeDefined();
    expect(result!.length).toBeLessThanOrEqual(60);
    expect(result!.endsWith("…")).toBe(true);
  });
});
