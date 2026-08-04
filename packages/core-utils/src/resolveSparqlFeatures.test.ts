import { resolveSparqlFeatures } from "./resolveSparqlFeatures";

describe("resolveSparqlFeatures", () => {
  it("defaults to all-false for undefined flavour", () => {
    expect(resolveSparqlFeatures(undefined)).toEqual({
      lateralNestedPagination: false,
      bindSingleSubject: false,
      oxigraphEmptyGroupCount: false,
      blazegraphFulltextSearch: false,
    });
  });

  it("oxigraph enables BIND, COUNT quirk, and LATERAL", () => {
    expect(resolveSparqlFeatures("oxigraph")).toEqual({
      lateralNestedPagination: true,
      bindSingleSubject: true,
      oxigraphEmptyGroupCount: true,
      blazegraphFulltextSearch: false,
    });
  });

  it("jena enables LATERAL only", () => {
    expect(resolveSparqlFeatures("jena")).toEqual({
      lateralNestedPagination: true,
      bindSingleSubject: false,
      oxigraphEmptyGroupCount: false,
      blazegraphFulltextSearch: false,
    });
  });

  it("blazegraph enables FTS search profile", () => {
    expect(resolveSparqlFeatures("blazegraph").blazegraphFulltextSearch).toBe(
      true,
    );
  });

  it("merges overrides on top of flavour defaults", () => {
    expect(
      resolveSparqlFeatures("oxigraph", { lateralNestedPagination: false }),
    ).toEqual({
      lateralNestedPagination: false,
      bindSingleSubject: true,
      oxigraphEmptyGroupCount: true,
      blazegraphFulltextSearch: false,
    });
  });
});
