import { describe, expect, test } from "@jest/globals";
import { expandPropertyName } from "./expandPropertyName";

describe("expandPropertyName", () => {
  const baseIRI = "http://schema.org/";

  test("expands local property name with baseIRI", () => {
    const result = expandPropertyName("name", baseIRI);

    expect(result).toBe("http://schema.org/name");
  });

  test("expands prefixed property with context", () => {
    const context = {
      dc: "http://purl.org/dc/elements/1.1/",
    };

    const result = expandPropertyName("dc:title", baseIRI, context);

    expect(result).toBe("http://purl.org/dc/elements/1.1/title");
  });

  test("expands multiple prefixes correctly", () => {
    const context = {
      dc: "http://purl.org/dc/elements/1.1/",
      exif: "http://www.w3.org/2003/12/exif/ns#",
      foaf: "http://xmlns.com/foaf/0.1/",
    };

    expect(expandPropertyName("dc:title", baseIRI, context)).toBe(
      "http://purl.org/dc/elements/1.1/title",
    );
    expect(expandPropertyName("exif:make", baseIRI, context)).toBe(
      "http://www.w3.org/2003/12/exif/ns#make",
    );
    expect(expandPropertyName("foaf:name", baseIRI, context)).toBe(
      "http://xmlns.com/foaf/0.1/name",
    );
  });

  test("returns full IRI unchanged", () => {
    const fullIRI = "http://example.com/customProperty";

    const result = expandPropertyName(fullIRI, baseIRI);

    expect(result).toBe(fullIRI);
  });

  test("returns full IRI unchanged even with context", () => {
    const fullIRI = "http://example.com/customProperty";
    const context = {
      dc: "http://purl.org/dc/elements/1.1/",
    };

    const result = expandPropertyName(fullIRI, baseIRI, context);

    expect(result).toBe(fullIRI);
  });

  test("handles property without matching prefix", () => {
    const context = {
      dc: "http://purl.org/dc/elements/1.1/",
    };

    // "foaf:name" doesn't have a matching prefix
    // isValidUrl treats it as a potentially valid URL (scheme:path format)
    const result = expandPropertyName("foaf:name", baseIRI, context);

    // isValidUrl returns true for "prefix:localname" format, so it's returned as-is
    expect(result).toBe("foaf:name");
  });

  test("handles empty context", () => {
    const result = expandPropertyName("name", baseIRI, {});

    expect(result).toBe("http://schema.org/name");
  });

  test("handles undefined context", () => {
    const result = expandPropertyName("name", baseIRI);

    expect(result).toBe("http://schema.org/name");
  });

  test("handles property with special characters", () => {
    const result = expandPropertyName("firstName", baseIRI);

    expect(result).toBe("http://schema.org/firstName");
  });

  test("handles property with numbers", () => {
    const result = expandPropertyName("property123", baseIRI);

    expect(result).toBe("http://schema.org/property123");
  });

  test("handles HTTPS IRIs", () => {
    const httpsIRI = "https://example.com/secureProperty";

    const result = expandPropertyName(httpsIRI, baseIRI);

    expect(result).toBe(httpsIRI);
  });

  test("handles empty base IRI", () => {
    const result = expandPropertyName("name", "");

    expect(result).toBe("name");
  });

  test("handles base IRI without trailing slash", () => {
    const result = expandPropertyName("name", "http://schema.org");

    expect(result).toBe("http://schema.orgname");
  });

  test("expands @id and @type properties", () => {
    expect(expandPropertyName("@id", baseIRI)).toBe("http://schema.org/@id");
    expect(expandPropertyName("@type", baseIRI)).toBe(
      "http://schema.org/@type",
    );
  });

  test("handles prefix with multiple colons in local part", () => {
    const context = {
      ns: "http://example.com/ns#",
    };

    const result = expandPropertyName("ns:prop:subprop", baseIRI, context);

    expect(result).toBe("http://example.com/ns#prop:subprop");
  });
});
