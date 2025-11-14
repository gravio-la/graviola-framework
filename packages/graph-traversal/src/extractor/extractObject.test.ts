import { describe, expect, test } from "@jest/globals";
import datasetFactory from "@rdfjs/dataset";
import type { JSONSchema7 } from "json-schema";
import clownface from "clownface";
import { schema, rdf } from "@tpluscode/rdf-ns-builders";
import { extractObject } from "./extractObject";
import { createNoOpLogger } from "./logger";
import type { ExtractionContext } from "./types";

describe("extractObject", () => {
  const createContext = (
    overrides?: Partial<ExtractionContext>,
  ): ExtractionContext => ({
    baseIRI: "http://schema.org/",
    dataset: datasetFactory.dataset(),
    normalizedSchema: {
      type: "object",
      properties: {},
      _normalized: true,
      _propertyMetadata: {},
    },
    options: {},
    depth: 0,
    logger: createNoOpLogger(),
    ...overrides,
  });

  test("extracts simple object with literals", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");
    person
      .addOut(rdf.type, schema.Person)
      .addOut(schema.name, "John Doe")
      .addOut(schema.email, "john@example.com");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const result = extractObject(person as any, personSchema, createContext());

    expect(result).toEqual({
      "@id": "http://example.com/person1",
      "@type": "http://schema.org/Person",
      name: "John Doe",
      email: "john@example.com",
    });
  });

  test("extracts nested object", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const address = cf.namedNode("http://example.com/address1");
    address
      .addOut(schema.streetAddress, "123 Main St")
      .addOut(schema.addressLocality, "Springfield");

    const person = cf.namedNode("http://example.com/person1");
    person.addOut(schema.name, "John Doe").addOut(schema.address, address);

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        address: {
          type: "object",
          properties: {
            streetAddress: { type: "string" },
            addressLocality: { type: "string" },
          },
        },
      },
    };

    const result = extractObject(
      person as any,
      personSchema,
      createContext({
        dataset,
      }),
    );

    expect(result).toEqual({
      "@id": "http://example.com/person1",
      name: "John Doe",
      address: {
        "@id": "http://example.com/address1",
        streetAddress: "123 Main St",
        addressLocality: "Springfield",
      },
    });
  });

  test("stops at schema stub (only @id)", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const author = cf.namedNode("http://example.com/author1");
    author
      .addOut(schema.name, "Jane Doe")
      .addOut(schema.email, "jane@example.com");

    const book = cf.namedNode("http://example.com/book1");
    book.addOut(schema.name, "Great Book").addOut(schema.author, author);

    // Schema with stub for author (only @id property)
    const bookSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        author: {
          type: "object",
          properties: {
            "@id": { type: "string" },
          },
        },
      },
    };

    const result = extractObject(
      book as any,
      bookSchema,
      createContext({
        dataset,
      }),
    );

    expect(result).toEqual({
      "@id": "http://example.com/book1",
      name: "Great Book",
      author: {
        "@id": "http://example.com/author1",
      },
    });
  });

  test("extracts array of literals", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");
    person
      .addOut(schema.name, "John Doe")
      .addOut(schema.knows, "Alice")
      .addOut(schema.knows, "Bob")
      .addOut(schema.knows, "Charlie");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        knows: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const result = extractObject(person as any, personSchema, createContext());

    expect(result).toEqual({
      "@id": "http://example.com/person1",
      name: "John Doe",
      knows: ["Alice", "Bob", "Charlie"],
    });
  });

  test("extracts array of objects", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const friend1 = cf.namedNode("http://example.com/friend1");
    friend1.addOut(schema.name, "Alice");

    const friend2 = cf.namedNode("http://example.com/friend2");
    friend2.addOut(schema.name, "Bob");

    const person = cf.namedNode("http://example.com/person1");
    person
      .addOut(schema.name, "John Doe")
      .addOut(schema.knows, friend1)
      .addOut(schema.knows, friend2);

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        knows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      },
    };

    const result = extractObject(
      person as any,
      personSchema,
      createContext({
        dataset,
      }),
    );

    expect(result).toEqual({
      "@id": "http://example.com/person1",
      name: "John Doe",
      knows: [
        { "@id": "http://example.com/friend1", name: "Alice" },
        { "@id": "http://example.com/friend2", name: "Bob" },
      ],
    });
  });

  test("applies pagination to array", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");
    person
      .addOut(schema.name, "John Doe")
      .addOut(schema.knows, "Alice")
      .addOut(schema.knows, "Bob")
      .addOut(schema.knows, "Charlie")
      .addOut(schema.knows, "David")
      .addOut(schema.knows, "Eve");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        knows: {
          type: "array",
          items: { type: "string" },
          "x-pagination": { skip: 1, take: 3 },
        } as any,
      },
    };

    const result = extractObject(person as any, personSchema, createContext());

    expect(result?.knows).toEqual(["Bob", "Charlie", "David"]);
  });

  test("respects doNotRecurseNamedNodes option", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const author = cf.namedNode("http://example.com/author1");
    author.addOut(schema.name, "Jane Doe");

    const book = cf.namedNode("http://example.com/book1");
    book.addOut(schema.name, "Great Book").addOut(schema.author, author);

    const bookSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        author: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
    };

    const result = extractObject(
      book as any,
      bookSchema,
      createContext({
        dataset,
        depth: 0, // Root level - extract book properties
        options: { doNotRecurseNamedNodes: true },
      }),
    );

    expect(result).toEqual({
      "@id": "http://example.com/book1",
      name: "Great Book",
      author: {
        "@id": "http://example.com/author1",
        // name should NOT be extracted due to doNotRecurseNamedNodes (author is at depth 1)
      },
    });
  });

  test("respects maxRecursion option", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");
    person.addOut(schema.name, "John");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const result = extractObject(
      person as any,
      personSchema,
      createContext({
        depth: 10,
        options: { maxRecursion: 5 },
      }),
    );

    expect(result).toBeUndefined();
  });

  test("returns empty object when no properties exist", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const result = extractObject(person as any, personSchema, createContext());

    expect(result).toEqual({
      "@id": "http://example.com/person1",
    });
  });

  test("omits empty object when option is set", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const result = extractObject(
      person as any,
      personSchema,
      createContext({
        options: { omitEmptyObjects: true },
      }),
    );

    expect(result).toBeUndefined();
  });

  test("omits empty arrays when option is set", () => {
    const dataset = datasetFactory.dataset();
    const cf = clownface({ dataset });

    const person = cf.namedNode("http://example.com/person1");
    person.addOut(schema.name, "John Doe");

    const personSchema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        knows: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    const result = extractObject(
      person as any,
      personSchema,
      createContext({
        options: { omitEmptyArrays: true },
      }),
    );

    expect(result).toEqual({
      "@id": "http://example.com/person1",
      name: "John Doe",
      // knows should not be present
    });
  });
});
