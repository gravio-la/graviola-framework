import { describe, expect, test } from "bun:test";
import { Parser } from "n3";
import { geoTurtle } from "./geo.turtle.generated";
import { geoStats } from "./stats";
import { GEO_VOCAB_BASE } from "./schema";

const countType = (turtle: string, typeName: string): number => {
  const typeIRI = `${GEO_VOCAB_BASE}${typeName}`;
  const parser = new Parser();
  const quads = parser.parse(turtle);
  return quads.filter(
    (q) =>
      q.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
      q.object.value === typeIRI,
  ).length;
};

const countPredicate = (turtle: string, predicateLocal: string): number => {
  const predicate = `${GEO_VOCAB_BASE}${predicateLocal}`;
  const parser = new Parser();
  const quads = parser.parse(turtle);
  return quads.filter((q) => q.predicate.value === predicate).length;
};

const countOwlSameAs = (turtle: string): number => {
  const parser = new Parser();
  const quads = parser.parse(turtle);
  return quads.filter(
    (q) => q.predicate.value === "http://www.w3.org/2002/07/owl#sameAs",
  ).length;
};

describe("@graviola/sample-data-geo fixture", () => {
  test("geoTurtle parses and matches geoStats", () => {
    expect(geoTurtle.length).toBeGreaterThan(1000);
    expect(countType(geoTurtle, "City")).toBe(geoStats.City);
    expect(countType(geoTurtle, "Place")).toBe(geoStats.Place);
    expect(countType(geoTurtle, "Region")).toBe(geoStats.Region);
    expect(countType(geoTurtle, "Country")).toBe(geoStats.Country);
    expect(countPredicate(geoTurtle, "population")).toBe(
      geoStats.withPopulation,
    );
    expect(countOwlSameAs(geoTurtle)).toBe(geoStats.sameAs);
    expect(countPredicate(geoTurtle, "contains")).toBe(geoStats.contains);
  });

  test("richest parent has expected child count via partOf", () => {
    const parser = new Parser();
    const quads = parser.parse(geoTurtle);
    const partOf = `${GEO_VOCAB_BASE}partOf`;
    const children = quads.filter(
      (q) =>
        q.predicate.value === partOf &&
        q.object.value === geoStats.richestParentIRI,
    );
    expect(children.length).toBe(geoStats.richestParentChildCount);
  });

  test("richest city-parent has matching forward contains edges", () => {
    const parser = new Parser();
    const quads = parser.parse(geoTurtle);
    const contains = `${GEO_VOCAB_BASE}contains`;
    const kids = quads.filter(
      (q) =>
        q.predicate.value === contains &&
        q.subject.value === geoStats.richestCityParentIRI,
    );
    expect(kids.length).toBe(geoStats.richestCityParentChildCount);
  });
});
