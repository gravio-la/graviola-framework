import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  extractSlubLodSearchSecondary,
  findEntityWithinSlubLod,
  type SlubLodSearchAdapterConfig,
} from "./mappings/slubLodAccess";

const sampleRecord = {
  "@id": "https://data.slub-dresden.de/persons/705012077",
  "@type": "http://schema.org/Person",
  preferredName: "Hegel",
  about: [
    {
      identifier: {
        propertyID: "biographicalOrHistoricalInformation",
        value: "Schauspieler",
      },
    },
  ],
  sameAs: [{ "@id": "https://d-nb.info/gnd/1013354443" }],
};

const geoRecord = {
  "@id": "https://data.slub-dresden.de/geo/358164990",
  "@type": "http://schema.org/Place",
  preferredName: "Leipzig",
  adressRegion: "XA-DE-SN",
  description: {
    description: "Oberbegriff partitiv",
    name: "Leipzig",
  },
  sameAs: [{ "@id": "https://d-nb.info/gnd/4712325-4" }],
};

const indexSearchConfig: SlubLodSearchAdapterConfig = {
  useSchemaOrgTypeFilter: true,
  useReconcileApi: false,
};

describe("extractSlubLodSearchSecondary", () => {
  test("prefers biographical information for persons", () => {
    expect(extractSlubLodSearchSecondary(sampleRecord)).toBe("Schauspieler");
  });

  test("combines GND, region, and description context for geo records", () => {
    expect(extractSlubLodSearchSecondary(geoRecord)).toBe(
      "GND 4712325-4 · XA-DE-SN · Oberbegriff partitiv: Leipzig",
    );
  });
});

describe("findEntityWithinSlubLod", () => {
  afterEach(() => {
    mock.restore();
  });

  test("maps search hits with sanitized sameAsLinks and allProps", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([sampleRecord]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const hits = await findEntityWithinSlubLod(
      "Hegel",
      "Person",
      2,
      indexSearchConfig,
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("https://data.slub-dresden.de/persons/705012077");
    expect(hits[0]?.label).toBe("Hegel");
    expect(hits[0]?.secondary).toBe("Schauspieler");
    expect(hits[0]?.allProps.sameAsLinks).toEqual([
      { "@id": "https://d-nb.info/gnd/1013354443" },
    ]);
    expect(hits[0]?.allProps.sameAs).toBeUndefined();

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe("/persons/search");
    expect(calledUrl.searchParams.get("q")).toBe(
      "preferredName:Hegel OR alternateName:Hegel",
    );
    expect(calledUrl.searchParams.get("size")).toBe("2");
    expect(calledUrl.searchParams.get("filter")).toBe(
      "@type:http://schema.org/Person",
    );
  });

  test("queries organizations index for Corporation typeName", async () => {
    const orgRecord = {
      "@id": "https://data.slub-dresden.de/organizations/851530850",
      "@type": "http://schema.org/Organization",
      preferredName: "Landesbibliothek",
    };
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([orgRecord]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const hits = await findEntityWithinSlubLod(
      "Landesbibliothek",
      "Corporation",
      10,
      indexSearchConfig,
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.label).toBe("Landesbibliothek");

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe("/organizations/search");
    expect(calledUrl.searchParams.get("filter")).toBe(
      "@type:http://schema.org/Organization",
    );
  });

  test("uses reconcile API when adapter flag is enabled", async () => {
    const fetchMock = mock((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      const body = decodeURIComponent(String(init?.body ?? ""));
      expect(body).toContain("Leipzig");
      expect(body).toContain("http://schema.org/Place");
      return Promise.resolve(
        new Response(
          JSON.stringify({
            q0: {
              result: [
                {
                  id: "geo/104798998",
                  name: "Leipzig",
                  description: "http://schema.org/Place",
                },
              ],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const hits = await findEntityWithinSlubLod("Leipzig", "Place", 5, {
      useSchemaOrgTypeFilter: true,
      useReconcileApi: true,
    });

    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("https://data.slub-dresden.de/geo/104798998");
    expect(hits[0]?.label).toBe("Leipzig");
    expect(hits[0]?.secondary).toBe("http://schema.org/Place");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://data.slub-dresden.de/reconcile/",
    );
  });

  test("returns empty list for unsupported typeName", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response("[]", { status: 200 })),
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const hits = await findEntityWithinSlubLod("Test", "Exhibition");
    expect(hits).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
