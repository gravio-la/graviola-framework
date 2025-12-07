import { describe, it, expect } from "vitest";
import { convertIRIToNode } from "./iriConverter";
import df from "@rdfjs/data-model";

describe("convertIRIToNode", () => {
  describe("no colon - default prefix", () => {
    it("should prefix simple names with colon", () => {
      const result = convertIRIToNode("name", {});
      expect(result).toBe(":name");
    });

    it("should prefix simple names with colon even with prefixMap", () => {
      const result = convertIRIToNode("age", { schema: "http://schema.org/" });
      expect(result).toBe(":age");
    });
  });

  describe("known prefix - leave as-is", () => {
    it("should keep prefixed name when prefix is in map", () => {
      const prefixMap = {
        schema: "http://schema.org/",
        foaf: "http://xmlns.com/foaf/0.1/",
      };

      const result1 = convertIRIToNode("schema:Person", prefixMap);
      expect(result1).toBe("schema:Person");

      const result2 = convertIRIToNode("foaf:name", prefixMap);
      expect(result2).toBe("foaf:name");
    });

    it("should handle empty prefix (default namespace)", () => {
      const prefixMap = {
        "": "http://example.org/",
      };

      const result = convertIRIToNode(":entity", prefixMap);
      expect(result).toBe(":entity");
    });
  });

  describe("unknown prefix or full IRI - becomes NamedNode", () => {
    it("should convert full HTTP IRI to NamedNode", () => {
      const result = convertIRIToNode("http://example.org/entity", {});
      expect(result).toEqual(df.namedNode("http://example.org/entity"));
      expect(typeof result).not.toBe("string");
      if (typeof result !== "string") {
        expect(result.termType).toBe("NamedNode");
      }
    });

    it("should convert full HTTPS IRI to NamedNode", () => {
      const result = convertIRIToNode("https://schema.org/Person", {});
      expect(result).toEqual(df.namedNode("https://schema.org/Person"));
    });

    it("should convert URN to NamedNode", () => {
      const result = convertIRIToNode("urn:uuid:12345", {});
      expect(result).toEqual(df.namedNode("urn:uuid:12345"));
    });

    it("should convert unknown prefix to NamedNode", () => {
      const result = convertIRIToNode("unknown:something", {
        schema: "http://schema.org/",
      });
      expect(result).toEqual(df.namedNode("unknown:something"));
    });

    it("should handle complex URIs", () => {
      const result = convertIRIToNode(
        "http://example.org/path/to/resource?query=1#fragment",
        {},
      );
      expect(result).toEqual(
        df.namedNode("http://example.org/path/to/resource?query=1#fragment"),
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty prefixMap", () => {
      const result = convertIRIToNode("schema:Person", {});
      expect(result).toEqual(df.namedNode("schema:Person"));
    });

    it("should handle prefixMap with multiple prefixes but IRI uses unknown one", () => {
      const prefixMap = {
        schema: "http://schema.org/",
        foaf: "http://xmlns.com/foaf/0.1/",
      };
      const result = convertIRIToNode("dc:title", prefixMap);
      expect(result).toEqual(df.namedNode("dc:title"));
    });

    it("should handle IRIs with multiple colons", () => {
      const result = convertIRIToNode("http://example.org:8080/path", {});
      // First colon is after "http", so prefix is "http"
      // Since "http" is not in prefixMap, it becomes a NamedNode
      expect(result).toEqual(df.namedNode("http://example.org:8080/path"));
    });
  });
});
