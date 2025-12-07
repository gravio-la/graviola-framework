import { describe, it, expect } from "vitest";
import { createBindOrValuesPattern } from "./sparqlBindOrValues";
import df from "@rdfjs/data-model";

describe("createBindOrValuesPattern", () => {
  describe("BIND pattern (single entity with Oxigraph)", () => {
    it("should create BIND pattern for single full IRI with oxigraph flavour", () => {
      const variable = df.variable("subject");
      const result = createBindOrValuesPattern(
        "http://example.org/entity1",
        variable,
        { flavour: "oxigraph" },
      );

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain("<http://example.org/entity1>");
      expect(query).toContain("?subject");
    });

    it("should create BIND pattern with useBind option", () => {
      const variable = df.variable("person");
      const result = createBindOrValuesPattern(
        "http://example.org/person1",
        variable,
        { useBind: true },
      );

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain("<http://example.org/person1>");
      expect(query).toContain("?person");
    });

    it("should create BIND pattern for prefixed IRI with oxigraph", () => {
      const variable = df.variable("entity");
      const result = createBindOrValuesPattern("ex:entity1", variable, {
        flavour: "oxigraph",
        prefixMap: { ex: "http://example.org/" },
      });

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain("ex:entity1");
      expect(query).toContain("?entity");
    });

    it("should handle default prefix with oxigraph", () => {
      const variable = df.variable("thing");
      const result = createBindOrValuesPattern("entity1", variable, {
        flavour: "oxigraph",
      });

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain(":entity1");
      expect(query).toContain("?thing");
    });
  });

  describe("VALUES pattern (multiple entities or default)", () => {
    it("should create VALUES pattern for multiple full IRIs", () => {
      const variable = df.variable("subject");
      const result = createBindOrValuesPattern(
        [
          "http://example.org/entity1",
          "http://example.org/entity2",
          "http://example.org/entity3",
        ],
        variable,
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).toContain("?subject");
      expect(query).toContain("<http://example.org/entity1>");
      expect(query).toContain("<http://example.org/entity2>");
      expect(query).toContain("<http://example.org/entity3>");
    });

    it("should create VALUES pattern for single IRI without oxigraph", () => {
      const variable = df.variable("entity");
      const result = createBindOrValuesPattern(
        "http://example.org/entity1",
        variable,
        // No flavour option - defaults to VALUES
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).toContain("?entity");
      expect(query).toContain("<http://example.org/entity1>");
    });

    it("should create VALUES pattern with default flavour even for single entity", () => {
      const variable = df.variable("person");
      const result = createBindOrValuesPattern(
        "http://example.org/person1",
        variable,
        { flavour: "default" },
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).toContain("?person");
    });

    it("should create VALUES pattern for multiple prefixed IRIs", () => {
      const variable = df.variable("entity");
      const prefixMap = { ex: "http://example.org/" };
      const result = createBindOrValuesPattern(
        ["ex:entity1", "ex:entity2", "ex:entity3"],
        variable,
        { prefixMap },
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).toContain("?entity");
      expect(query).toContain("ex:entity1");
      expect(query).toContain("ex:entity2");
      expect(query).toContain("ex:entity3");
    });

    it("should handle mix of prefixed and full IRIs", () => {
      const variable = df.variable("resource");
      const prefixMap = { schema: "http://schema.org/" };
      const result = createBindOrValuesPattern(
        [
          "schema:Person",
          "http://example.org/CustomType",
          "foaf:Agent", // unknown prefix - becomes full IRI
        ],
        variable,
        { prefixMap },
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).toContain("?resource");
      expect(query).toContain("schema:Person");
      expect(query).toContain("<http://example.org/CustomType>");
      expect(query).toContain("<foaf:Agent>"); // Unknown prefix becomes NamedNode
    });

    it("should override oxigraph for multiple entities", () => {
      // Even with oxigraph, multiple entities should use VALUES
      const variable = df.variable("subject");
      const result = createBindOrValuesPattern(
        ["http://example.org/entity1", "http://example.org/entity2"],
        variable,
        { flavour: "oxigraph" },
      );

      const query = result.toString();
      expect(query).toContain("VALUES");
      expect(query).not.toContain("BIND");
    });
  });

  describe("variable handling", () => {
    it("should handle different variable names", () => {
      const testCases = [
        "s",
        "subject",
        "entity",
        "person",
        "thing",
        "x",
        "resource123",
      ];

      for (const varName of testCases) {
        const variable = df.variable(varName);
        const result = createBindOrValuesPattern(
          "http://example.org/entity",
          variable,
          { flavour: "oxigraph" },
        );

        const query = result.toString();
        expect(query).toContain(`?${varName}`);
      }
    });
  });

  describe("edge cases and errors", () => {
    it("should throw error for empty array", () => {
      const variable = df.variable("subject");
      expect(() => {
        createBindOrValuesPattern([], variable);
      }).toThrow("entityIRIList is empty, would result in invalid SPARQL");
    });

    it("should handle URNs", () => {
      const variable = df.variable("entity");
      const result = createBindOrValuesPattern(
        "urn:uuid:12345-67890",
        variable,
        { flavour: "oxigraph" },
      );

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain("<urn:uuid:12345-67890>");
    });

    it("should handle HTTPS IRIs", () => {
      const variable = df.variable("secure");
      const result = createBindOrValuesPattern(
        "https://schema.org/Person",
        variable,
        { flavour: "oxigraph" },
      );

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain("<https://schema.org/Person>");
    });

    it("should handle complex IRIs with query params", () => {
      const variable = df.variable("complex");
      const result = createBindOrValuesPattern(
        "http://example.org/resource?id=123&type=person#fragment",
        variable,
        { flavour: "oxigraph" },
      );

      const query = result.toString();
      expect(query).toContain("BIND");
      expect(query).toContain(
        "<http://example.org/resource?id=123&type=person#fragment>",
      );
    });
  });

  describe("flavour options", () => {
    it("should use BIND for oxigraph flavour", () => {
      const variable = df.variable("s");
      const result = createBindOrValuesPattern(
        "http://example.org/entity",
        variable,
        { flavour: "oxigraph" },
      );

      expect(result.toString()).toContain("BIND");
    });

    it("should use VALUES for default flavour", () => {
      const variable = df.variable("s");
      const result = createBindOrValuesPattern(
        "http://example.org/entity",
        variable,
        { flavour: "default" },
      );

      expect(result.toString()).toContain("VALUES");
    });

    it("should use VALUES for blazegraph flavour", () => {
      const variable = df.variable("s");
      const result = createBindOrValuesPattern(
        "http://example.org/entity",
        variable,
        { flavour: "blazegraph" },
      );

      expect(result.toString()).toContain("VALUES");
    });

    it("should use VALUES for allegro flavour", () => {
      const variable = df.variable("s");
      const result = createBindOrValuesPattern(
        "http://example.org/entity",
        variable,
        { flavour: "allegro" },
      );

      expect(result.toString()).toContain("VALUES");
    });
  });

  describe("composability with sparql-builder", () => {
    it("should return SparqlTemplateResult that can be composed", () => {
      const variable = df.variable("subject");
      const result = createBindOrValuesPattern(
        "http://example.org/entity1",
        variable,
        { flavour: "oxigraph" },
      );

      // Should have toString method
      expect(typeof result.toString).toBe("function");

      // Should be composable (has the required structure)
      expect(result).toBeDefined();
      expect(result.toString()).toBeTruthy();
    });
  });
});
