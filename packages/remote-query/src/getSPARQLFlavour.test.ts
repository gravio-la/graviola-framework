import { getSPARQLFlavour, getSparqlDialect } from "./getSPARQLFlavour";

describe("getSPARQLFlavour", () => {
  it("maps providers to engine profiles", () => {
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "oxigraph" }),
    ).toBe("oxigraph");
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "worker" }),
    ).toBe("oxigraph");
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "fuseki" }),
    ).toBe("jena");
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "blazegraph" }),
    ).toBe("blazegraph");
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "allegro" }),
    ).toBe("allegro");
    expect(
      getSPARQLFlavour({ endpoint: "x", active: true, provider: "virtuoso" }),
    ).toBe("default");
    expect(getSPARQLFlavour(undefined)).toBe("default");
  });
});

describe("getSparqlDialect", () => {
  it("returns flavour and resolved features", () => {
    const d = getSparqlDialect({
      endpoint: "x",
      active: true,
      provider: "oxigraph",
    });
    expect(d.flavour).toBe("oxigraph");
    expect(d.features.lateralNestedPagination).toBe(true);
    expect(d.features.bindSingleSubject).toBe(true);
  });

  it("applies feature overrides", () => {
    const d = getSparqlDialect(
      { endpoint: "x", active: true, provider: "oxigraph" },
      { lateralNestedPagination: false },
    );
    expect(d.features.lateralNestedPagination).toBe(false);
    expect(d.features.bindSingleSubject).toBe(true);
  });
});
