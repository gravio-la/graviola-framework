import { describe, test, expect } from "@jest/globals";
import { sparql } from "@tpluscode/sparql-builder";
import df from "@rdfjs/data-model";
import { xsd } from "@tpluscode/rdf-ns-builders";
import {
  castVariable,
  castToInteger,
  castToDecimal,
  castToBoolean,
} from "./cast";

describe("castVariable", () => {
  test("generates correct XSD constructor function call", () => {
    const variable = df.variable("age");
    const result = castVariable(variable, xsd.integer);

    // Should generate: xsd:integer(?age) with PREFIX declaration
    const resultString = result.toString();
    expect(resultString).toContain("xsd:integer");
    expect(resultString).toContain("?age");
    expect(resultString).toMatch(/xsd:integer\(\?age\)/);
  });

  test("castToInteger convenience function", () => {
    const variable = df.variable("count");
    const result = castToInteger(variable);

    const resultString = result.toString();
    expect(resultString).toContain("integer");
    expect(resultString).toContain("?count");
  });

  test("castToDecimal convenience function", () => {
    const variable = df.variable("price");
    const result = castToDecimal(variable);

    const resultString = result.toString();
    expect(resultString).toContain("decimal");
    expect(resultString).toContain("?price");
  });

  test("castToBoolean convenience function", () => {
    const variable = df.variable("active");
    const result = castToBoolean(variable);

    const resultString = result.toString();
    expect(resultString).toContain("boolean");
    expect(resultString).toContain("?active");
  });

  test("works in FILTER expression", () => {
    const variable = df.variable("age");
    const castVar = castToInteger(variable);
    const literal = df.literal("18", xsd.integer);

    const filter = sparql`FILTER(${castVar} >= ${literal})`;
    const filterString = filter.toString();

    // Should contain the cast function and comparison
    expect(filterString).toContain("FILTER");
    expect(filterString).toContain("integer");
    expect(filterString).toContain(">=");
  });
});
