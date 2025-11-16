import { describe, test, expect } from "@jest/globals";
import { prefixes2sparqlPrefixDeclaration } from "./prefixes2sparqlPrefixDeclaration";

describe("prefixes2sparqlPrefixDeclaration", () => {
  test("generates PREFIX declarations for all prefixes", () => {
    const prefixes = {
      "": "http://example.com/",
      foaf: "http://xmlns.com/foaf/0.1/",
      schema: "http://schema.org/",
    };

    const result = prefixes2sparqlPrefixDeclaration(prefixes);

    expect(result).toContain("PREFIX : <http://example.com/>");
    expect(result).toContain("PREFIX foaf: <http://xmlns.com/foaf/0.1/>");
    expect(result).toContain("PREFIX schema: <http://schema.org/>");
  });

  test("handles empty prefix map", () => {
    const result = prefixes2sparqlPrefixDeclaration({});
    expect(result).toBe("");
  });

  test("deduplicates prefixes when existingQuery is provided", () => {
    const prefixes = {
      "": "http://example.com/",
      foaf: "http://xmlns.com/foaf/0.1/",
      schema: "http://schema.org/",
    };

    const existingQuery = `PREFIX foaf: <http://xmlns.com/foaf/0.1/>

CONSTRUCT { ?s ?p ?o }
WHERE { ?s ?p ?o }`;

    const result = prefixes2sparqlPrefixDeclaration(prefixes, existingQuery);

    // Should include new prefixes
    expect(result).toContain("PREFIX : <http://example.com/>");
    expect(result).toContain("PREFIX schema: <http://schema.org/>");

    // Should NOT include already-declared prefixes
    expect(result).not.toContain("PREFIX foaf:");
  });

  test("filters out auto-added prefixes (rdf, xsd)", () => {
    const prefixes = {
      "": "http://example.com/",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      schema: "http://schema.org/",
      xsd: "http://www.w3.org/2001/XMLSchema#",
    };

    const result = prefixes2sparqlPrefixDeclaration(prefixes);

    // Should include custom prefixes
    expect(result).toContain("PREFIX : <http://example.com/>");
    expect(result).toContain("PREFIX schema: <http://schema.org/>");

    // Should NOT include auto-added prefixes
    expect(result).not.toContain("PREFIX rdf:");
    expect(result).not.toContain("PREFIX xsd:");
  });

  test("handles case-insensitive PREFIX matching", () => {
    const prefixes = {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#", // uppercase
    };

    const existingQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>`;

    const result = prefixes2sparqlPrefixDeclaration(prefixes, existingQuery);

    // Should still deduplicate rdf (case-sensitive match is enough)
    expect(result).not.toContain("PREFIX rdf:");

    // But RDF (uppercase) is different and should be included
    expect(result).toContain("PREFIX RDF:");
  });

  test("handles default prefix (empty string)", () => {
    const prefixes = {
      "": "http://example.com/",
    };

    const existingQuery = `PREFIX : <http://example.com/>`;

    const result = prefixes2sparqlPrefixDeclaration(prefixes, existingQuery);

    // Should deduplicate default prefix
    expect(result).toBe("");
  });

  test("handles complex query with multiple PREFIX declarations", () => {
    const prefixes = {
      foaf: "http://xmlns.com/foaf/0.1/",
      dcterms: "http://purl.org/dc/terms/",
      schema: "http://schema.org/",
    };

    const existingQuery = `PREFIX foaf: <http://xmlns.com/foaf/0.1/>

CONSTRUCT { ?s foaf:name ?name }
WHERE { ?s foaf:name ?name }`;

    const result = prefixes2sparqlPrefixDeclaration(prefixes, existingQuery);

    // Should include new prefixes
    expect(result).toContain("PREFIX dcterms:");
    expect(result).toContain("PREFIX schema:");

    // Should not include existing prefix
    expect(result).not.toContain("PREFIX foaf:");
  });

  test("generates correct format with newlines", () => {
    const prefixes = {
      foaf: "http://xmlns.com/foaf/0.1/",
      schema: "http://schema.org/",
    };

    const result = prefixes2sparqlPrefixDeclaration(prefixes);

    // Should have newline between declarations
    expect(result).toBe(
      "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX schema: <http://schema.org/>",
    );
  });
});
