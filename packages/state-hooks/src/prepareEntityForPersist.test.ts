import { describe, expect, it } from "bun:test";
import { prepareEntityForPersist } from "./prepareEntityForPersist";

describe("prepareEntityForPersist", () => {
  it("strips $meta from root and nested named entities", () => {
    const payload = prepareEntityForPersist({
      "@id": "https://example.org/recipe/1",
      "@type": "https://example.org/Rezept",
      $meta: { modified: "2026-01-01T00:00:00.000Z" },
      zutaten: [
        {
          "@id": "https://example.org/line/1",
          "@type": "https://example.org/RezeptZutat",
          zutatRef: {
            "@id": "https://example.org/zutat/1",
            "@type": "https://example.org/Zutat",
            name: "Mehl",
            $meta: { modified: "2026-01-02T00:00:00.000Z" },
          },
        },
      ],
    });

    expect(payload.$meta).toBeUndefined();
    expect(
      (payload.zutaten as Record<string, unknown>[])[0]?.zutatRef,
    ).toMatchObject({
      "@id": "https://example.org/zutat/1",
      name: "Mehl",
    });
    expect(
      (
        (payload.zutaten as Record<string, unknown>[])[0]?.zutatRef as Record<
          string,
          unknown
        >
      ).$meta,
    ).toBeUndefined();
  });
});
