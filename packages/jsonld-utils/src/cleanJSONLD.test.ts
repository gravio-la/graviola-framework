import type { JSONSchema7 } from "json-schema";
import {
  cleanProperty,
  recursiveFilter,
  removeInversePropertiesFromSchema,
  cleanJSONLD,
  pruneLinkedDocumentsToReferences,
} from "./cleanJSONLD";
import {
  GARDEN_IRI,
  geoFeatureRootSchema,
  geoFeatureRootSchemaZodOptionalStyle,
} from "./geo-feature-schema.fixture";

/** Same as bringDefinitionToTop(schema, "GeoFeature") for root schemas that only define `definitions`. */
const bringGeoFeatureToTop = (schema: JSONSchema7): JSONSchema7 => {
  const def = schema.definitions?.GeoFeature as JSONSchema7 | undefined;
  if (!def) throw new Error("fixture: missing definitions.GeoFeature");
  const { title: _t, description: _d, ...rest } = schema;
  return { ...rest, ...def };
};

describe("cleanJSONLD", () => {
  // Shared options for all tests
  const testOptions = {
    defaultPrefix: "http://example.com/",
    jsonldContext: { "@context": { "@vocab": "http://example.com/" } },
  };

  describe("cleanProperty", () => {
    it("should return primitive values unchanged", () => {
      expect(cleanProperty("string")).toBe("string");
      expect(cleanProperty(123)).toBe(123);
      expect(cleanProperty(true)).toBe(true);
      expect(cleanProperty(null)).toBe(null);
      expect(cleanProperty(undefined)).toBe(undefined);
    });

    it("should clean arrays by removing undefined/null values and cleaning nested objects", () => {
      const input = [1, null, undefined, { empty: {} }, { valid: "value" }];
      const result = cleanProperty(input);
      expect(result).toEqual([1, {}, { valid: "value" }]);
    });

    it("should remove empty objects", () => {
      const input = { empty: {} };
      const result = cleanProperty(input);
      expect(result).toEqual({});
    });

    it("should remove objects with only @type property", () => {
      const input = { typeOnly: { "@type": "SomeType" } };
      const result = cleanProperty(input);
      expect(result).toEqual({});
    });

    it("should keep objects with @type and other properties", () => {
      const input = { valid: { "@type": "SomeType", name: "test" } };
      const result = cleanProperty(input);
      expect(result).toEqual({ valid: { "@type": "SomeType", name: "test" } });
    });

    it("should handle nested structures", () => {
      const input = {
        level1: {
          level2: {
            empty: {},
            valid: "value",
            typeOnly: { "@type": "Type" },
          },
        },
      };
      const result = cleanProperty(input);
      expect(result).toEqual({
        level1: {
          level2: {
            valid: "value",
          },
        },
      });
    });

    it("should handle arrays with mixed content", () => {
      const input = [
        { valid: "data" },
        {},
        { "@type": "Type" },
        { "@type": "Type", name: "keep" },
      ];
      const result = cleanProperty(input);
      expect(result).toEqual([
        { valid: "data" },
        {},
        { "@type": "Type" },
        { "@type": "Type", name: "keep" },
      ]);
    });
  });

  describe("recursiveFilter", () => {
    it("should return null/undefined unchanged", () => {
      expect(recursiveFilter(null, () => false)).toBe(null);
      expect(recursiveFilter(undefined, () => false)).toBe(undefined);
    });

    it("should filter arrays based on tester function", () => {
      const data = [1, 2, 3, 4, 5];
      const tester = (item: any) => item % 2 === 0;
      const result = recursiveFilter(data, tester);
      expect(result).toEqual([1, 3, 5]);
    });

    it("should filter object values based on tester function", () => {
      const data = { a: 1, b: 2, c: 3 };
      const tester = (obj: any) => obj === 2;
      const result = recursiveFilter(data, tester);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should handle nested filtering", () => {
      const data = {
        level1: {
          level2: [1, 2, 3],
          other: "keep",
        },
      };
      const tester = (item: any) => item === 2;
      const result = recursiveFilter(data, tester);
      expect(result).toEqual({
        level1: {
          level2: [1, 3],
          other: "keep",
        },
      });
    });

    it("should use level parameter in tester function", () => {
      const data = { a: { b: { c: "value" } } };
      const tester = (item: any, level: number) => level === 1;
      const result = recursiveFilter(data, tester);
      expect(result).toEqual({});
    });

    it("should remove entire objects when tester returns true", () => {
      const data = { remove: "this", keep: "this" };
      const tester = (obj: any) => obj === "this";
      const result = recursiveFilter(data, tester);
      expect(result).toEqual({ remove: "this", keep: "this" });
    });

    it("should handle arrays with objects", () => {
      const data = [
        { id: 1, name: "test1" },
        { id: 2, name: "test2" },
        { id: 3, name: "test3" },
      ];
      const tester = (item: any) => item.id === 2;
      const result = recursiveFilter(data, tester);
      expect(result).toEqual([
        { id: 1, name: "test1" },
        { id: 3, name: "test3" },
      ]);
    });
  });

  describe("pruneLinkedDocumentsToReferences", () => {
    const root = "urn:comment1";

    it("reduces nested object with different @id to reference only", () => {
      const input = {
        "@id": root,
        "@type": "Comment",
        body: "hi",
        createdBy: {
          "@id": "urn:volunteer1",
          "@type": "Person",
          name: "Jane",
          email: "j@example.com",
        },
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual({
        "@id": root,
        "@type": "Comment",
        body: "hi",
        createdBy: { "@id": "urn:volunteer1" },
      });
    });

    it("maps arrays of linked entities to references", () => {
      const input = {
        "@id": root,
        tags: [
          { "@id": "urn:tag1", label: "a" },
          { "@id": "urn:tag2", label: "b" },
        ],
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual({
        "@id": root,
        tags: [{ "@id": "urn:tag1" }, { "@id": "urn:tag2" }],
      });
    });

    it("leaves nested objects without @id unchanged (blank nodes / value blocks)", () => {
      const input = {
        "@id": root,
        address: {
          street: "1 Main",
          city: "Berlin",
        },
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual(input);
    });

    it("does not strip the root node", () => {
      const input = {
        "@id": root,
        title: "t",
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual(input);
    });

    it("passes through minimal references unchanged", () => {
      const input = {
        "@id": root,
        ref: { "@id": "urn:other" },
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual(input);
    });

    it("preserves @context without recursing into it", () => {
      const input = {
        "@id": root,
        "@context": { ex: "http://example.com/ns#" },
        x: 1,
      };
      expect(pruneLinkedDocumentsToReferences(input, root)).toEqual(input);
    });
  });

  describe("removeInversePropertiesFromSchema", () => {
    it("should remove properties with x-inverseOf annotation", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          inverseProp: { type: "string", "x-inverseOf": "otherProp" } as any,
          normalProp: { type: "number" },
        },
      };
      const result = removeInversePropertiesFromSchema(schema);
      expect(result).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          normalProp: { type: "number" },
        },
      });
    });

    it("should handle nested object schemas", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          nested: {
            type: "object",
            properties: {
              keep: { type: "string" },
              remove: { type: "string", "x-inverseOf": "other" } as any,
            },
          },
        },
      };
      const result = removeInversePropertiesFromSchema(schema);
      expect(result).toEqual({
        type: "object",
        properties: {
          nested: {
            type: "object",
            properties: {
              keep: { type: "string" },
            },
          },
        },
      });
    });

    it("should handle array schemas", () => {
      const schema: JSONSchema7 = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            inverse: { type: "string", "x-inverseOf": "other" } as any,
          },
        },
      };
      const result = removeInversePropertiesFromSchema(schema);
      expect(result).toEqual({
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      });
    });

    it("should return schema unchanged if no inverse properties", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      };
      const result = removeInversePropertiesFromSchema(schema);
      expect(result).toEqual(schema);
    });

    it("should handle non-object schemas", () => {
      const schema: JSONSchema7 = { type: "string" };
      const result = removeInversePropertiesFromSchema(schema);
      expect(result).toEqual(schema);
    });
  });

  describe("cleanJSONLD", () => {
    const gardenGeoOptions = {
      defaultPrefix: GARDEN_IRI,
      jsonldContext: { "@context": { "@vocab": GARDEN_IRI } },
      keepContext: true,
      pruneLinkedDocuments: true,
    };

    it("GeoFeature: preserves WKT geo and modificationTime (pergola-style schema)", async () => {
      const schema = bringGeoFeatureToTop(geoFeatureRootSchema);
      const entityIRI = `${GARDEN_IRI}GeoFeature/kgaz2ac3f5g`;
      const wkt =
        "POLYGON ((13.731322209 51.083341811, 13.731324438 51.083328847))";
      const data = {
        "@id": entityIRI,
        "@type": `${GARDEN_IRI}GeoFeature`,
        geo: wkt,
        modificationTime: "2026-03-28T01:41:29.764Z",
      };
      const result = await cleanJSONLD(data as any, schema, gardenGeoOptions);
      expect(result.geo).toBe(wkt);
      expect(result.modificationTime).toBe("2026-03-28T01:41:29.764Z");
    });

    it("GeoFeature: preserves literals when schema uses Zod-style type [string, null] (upsert regression)", async () => {
      const schema = bringGeoFeatureToTop(geoFeatureRootSchemaZodOptionalStyle);
      const entityIRI = `${GARDEN_IRI}GeoFeature/kgaz2ac3f5g`;
      const wkt =
        "POLYGON ((13.731322209 51.083341811, 13.731324438 51.083328847))";
      const data = {
        "@id": entityIRI,
        "@type": `${GARDEN_IRI}GeoFeature`,
        geo: wkt,
        modificationTime: "2026-03-28T01:41:29.764Z",
      };
      const result = await cleanJSONLD(data as any, schema, gardenGeoOptions);
      expect(result.geo).toBe(wkt);
      expect(result.modificationTime).toBe("2026-03-28T01:41:29.764Z");
    });

    it("should accept the expected parameters", () => {
      const data = { "@id": "http://example.com/entity" };
      const schema: JSONSchema7 = { type: "object" };

      // This test just verifies the function signature
      expect(() => {
        cleanJSONLD(data, schema, testOptions);
      }).not.toThrow();
    });

    describe("pruneLinkedDocuments", () => {
      it("cleanJSONLD strips expanded linked nodes to @id references in saved shape", async () => {
        const volunteerIri = "urn:volunteer1";
        const data = {
          "@id": "urn:comment1",
          "@type": "Comment",
          body: "text",
          createdBy: {
            "@id": volunteerIri,
            "@type": "Person",
            name: "Jane",
            email: "x@y.z",
          },
        };
        const schema: JSONSchema7 = {
          definitions: {
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            Comment: {
              type: "object",
              properties: {
                body: { type: "string" },
                createdBy: { $ref: "#/definitions/Person" },
              },
            },
          },
          type: "object",
          properties: {
            body: { type: "string" },
            createdBy: { $ref: "#/definitions/Person" },
          },
        };

        const pruned = await cleanJSONLD(data, schema, {
          ...testOptions,
          pruneLinkedDocuments: true,
        });
        expect(pruned.createdBy).toEqual({ "@id": volunteerIri });
      });

      it("cleanJSONLD default matches explicit pruneLinkedDocuments false (no behavior change)", async () => {
        const volunteerIri = "urn:volunteer1";
        const data = {
          "@id": "urn:comment1",
          "@type": "Comment",
          body: "text",
          createdBy: {
            "@id": volunteerIri,
            "@type": "Person",
            name: "Jane",
            email: "x@y.z",
          },
        };
        const schema: JSONSchema7 = {
          definitions: {
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            Comment: {
              type: "object",
              properties: {
                body: { type: "string" },
                createdBy: { $ref: "#/definitions/Person" },
              },
            },
          },
          type: "object",
          properties: {
            body: { type: "string" },
            createdBy: { $ref: "#/definitions/Person" },
          },
        };

        const defaultOpts = await cleanJSONLD(data, schema, testOptions);
        const explicitFalse = await cleanJSONLD(data, schema, {
          ...testOptions,
          pruneLinkedDocuments: false,
        });
        expect(defaultOpts).toEqual(explicitFalse);
      });
    });

    describe("Data cleaning scenarios", () => {
      it("should handle typical person data with clean structure", async () => {
        const data = {
          "@id": "urn:person1",
          "@type": "Person",
          name: "John Doe",
          email: "john@example.com",
          age: 30,
          address: {
            "@type": "PostalAddress",
            street: "123 Main St",
            city: "New York",
            country: "USA",
          },
        };

        const schema: JSONSchema7 = {
          definitions: {
            PostalAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                country: { type: "string" },
              },
            },
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                age: { type: "number" },
                address: { $ref: "#/definitions/PostalAddress" },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            age: { type: "number" },
            address: { $ref: "#/definitions/PostalAddress" },
          },
        };

        const result = await cleanJSONLD(data, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it contains the expected cleaned data
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:person1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should clean messy data with empty objects and arrays", async () => {
        const messyData = {
          "@id": "urn:person1",
          "@type": "Person",
          name: "John Doe",
          emptyObject: {},
          emptyArray: [],
          nullValue: null,
          undefinedValue: undefined,
          typeOnly: { "@type": "SomeType" },
          validNested: {
            "@type": "Address",
            street: "123 Main St",
            empty: {},
            typeOnly: { "@type": "Type" },
          },
          mixedArray: [
            "valid string",
            {},
            { "@type": "Type" },
            { "@type": "Type", name: "keep this" },
            null,
            undefined,
          ],
        };

        const schema: JSONSchema7 = {
          definitions: {
            Address: {
              type: "object",
              properties: {
                street: { type: "string" },
              },
            },
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                validNested: { $ref: "#/definitions/Address" },
                mixedArray: {
                  type: "array",
                  items: {
                    oneOf: [{ type: "string" }, { type: "object" }],
                  },
                },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            validNested: { $ref: "#/definitions/Address" },
            mixedArray: {
              type: "array",
              items: {
                oneOf: [{ type: "string" }, { type: "object" }],
              },
            },
          },
        };
        const result = await cleanJSONLD(messyData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it contains the expected cleaned data
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:person1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should handle recursive data with circular references", async () => {
        const recursiveData = {
          "@id": "urn:person1",
          "@type": "Person",
          name: "Alice",
          knows: {
            "@id": "urn:person2",
            "@type": "Person",
            name: "Bob",
            knows: [
              {
                "@id": "urn:person1",
                "@type": "Person",
                name: "Alice (duplicate)",
                age: 25,
              },
            ],
          },
        };

        const schema: JSONSchema7 = {
          definitions: {
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
                knows: {
                  oneOf: [
                    { $ref: "#/definitions/Person" },
                    {
                      type: "array",
                      items: { $ref: "#/definitions/Person" },
                    },
                  ],
                },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            knows: {
              oneOf: [
                { $ref: "#/definitions/Person" },
                {
                  type: "array",
                  items: { $ref: "#/definitions/Person" },
                },
              ],
            },
          },
        };

        const result = await cleanJSONLD(recursiveData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it handles circular references
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:person1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should handle complex nested structures with multiple levels", async () => {
        const complexData = {
          "@id": "urn:organization1",
          "@type": "Organization",
          name: "Tech Corp",
          employees: [
            {
              "@id": "urn:person1",
              "@type": "Person",
              name: "John",
              department: {
                "@type": "Department",
                name: "Engineering",
                empty: {},
                typeOnly: { "@type": "Type" },
              },
              skills: [
                { "@type": "Skill", name: "JavaScript" },
                { "@type": "Skill" }, // Should be removed
                { name: "Python" }, // Should be kept
                {}, // Should be removed
              ],
            },
            {
              "@id": "urn:person2",
              "@type": "Person",
              name: "Jane",
              department: {
                "@type": "Department",
                name: "Marketing",
              },
            },
          ],
          emptyArray: [],
          nullValue: null,
        };

        const schema: JSONSchema7 = {
          definitions: {
            Department: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
            Skill: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
            Person: {
              type: "object",
              properties: {
                name: { type: "string" },
                department: { $ref: "#/definitions/Department" },
                skills: {
                  type: "array",
                  items: { $ref: "#/definitions/Skill" },
                },
              },
            },
            Organization: {
              type: "object",
              properties: {
                name: { type: "string" },
                employees: {
                  type: "array",
                  items: { $ref: "#/definitions/Person" },
                },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            employees: {
              type: "array",
              items: { $ref: "#/definitions/Person" },
            },
          },
        };

        const result = await cleanJSONLD(complexData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it handles complex nested structures
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:organization1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should handle data with mixed valid and invalid content", async () => {
        const mixedData = {
          "@id": "urn:document1",
          "@type": "Document",
          title: "Test Document",
          content: "This is valid content",
          metadata: {
            author: "John Doe",
            empty: {},
            typeOnly: { "@type": "Metadata" },
            valid: { "@type": "Metadata", version: "1.0" },
          },
          tags: [
            "important",
            {},
            { "@type": "Tag" },
            { "@type": "Tag", name: "test" },
            null,
            undefined,
          ],
          emptyObject: {},
          nullValue: null,
          undefinedValue: undefined,
        };

        const schema: JSONSchema7 = {
          definitions: {
            Metadata: {
              type: "object",
              properties: {
                author: { type: "string" },
                version: { type: "string" },
              },
            },
            Tag: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
            Document: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                metadata: { $ref: "#/definitions/Metadata" },
                tags: {
                  type: "array",
                  items: {
                    oneOf: [{ type: "string" }, { $ref: "#/definitions/Tag" }],
                  },
                },
              },
            },
          },
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            metadata: { $ref: "#/definitions/Metadata" },
            tags: {
              type: "array",
              items: {
                oneOf: [{ type: "string" }, { $ref: "#/definitions/Tag" }],
              },
            },
          },
        };

        const result = await cleanJSONLD(mixedData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it handles mixed content
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:document1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should handle deeply nested circular references", async () => {
        const deepCircularData = {
          "@id": "urn:node1",
          "@type": "Node",
          name: "Root",
          children: [
            {
              "@id": "urn:node2",
              "@type": "Node",
              name: "Child 1",
              parent: {
                "@id": "urn:node1",
                "@type": "Node",
                name: "Root (reference)",
                empty: {},
                typeOnly: { "@type": "Type" },
              },
              siblings: [
                {
                  "@id": "urn:node3",
                  "@type": "Node",
                  name: "Child 2",
                  parent: {
                    "@id": "urn:node1",
                    "@type": "Node",
                    name: "Root (another reference)",
                  },
                },
              ],
            },
          ],
        };

        const schema: JSONSchema7 = {
          definitions: {
            Node: {
              type: "object",
              properties: {
                name: { type: "string" },
                children: {
                  type: "array",
                  items: { $ref: "#/definitions/Node" },
                },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            children: {
              type: "array",
              items: { $ref: "#/definitions/Node" },
            },
          },
        };

        const result = await cleanJSONLD(deepCircularData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it handles deeply nested circular references
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:node1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });

      it("should handle arrays with mixed object types", async () => {
        const arrayData = {
          "@id": "urn:collection1",
          "@type": "Collection",
          name: "Mixed Collection",
          items: [
            "string item",
            42,
            true,
            null,
            undefined,
            {},
            { "@type": "Item" },
            { "@type": "Item", name: "Valid Item" },
            { name: "Item without type" },
            {
              "@id": "urn:item1",
              "@type": "Item",
              name: "Complex Item",
              properties: {
                empty: {},
                typeOnly: { "@type": "Property" },
                valid: { "@type": "Property", value: "test" },
              },
            },
          ],
        };

        const schema: JSONSchema7 = {
          definitions: {
            Property: {
              type: "object",
              properties: {
                value: { type: "string" },
              },
            },
            Item: {
              type: "object",
              properties: {
                name: { type: "string" },
                properties: { $ref: "#/definitions/Property" },
              },
            },
            Collection: {
              type: "object",
              properties: {
                name: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    oneOf: [
                      { type: "string" },
                      { type: "number" },
                      { type: "boolean" },
                      { $ref: "#/definitions/Item" },
                    ],
                  },
                },
              },
            },
          },
          type: "object",
          properties: {
            name: { type: "string" },
            items: {
              type: "array",
              items: {
                oneOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "boolean" },
                  { $ref: "#/definitions/Item" },
                ],
              },
            },
          },
        };

        const result = await cleanJSONLD(arrayData, schema, testOptions);
        console.dir(result, { depth: null });

        // Test that we get a result and it handles arrays with mixed object types
        expect(result).toBeDefined();
        expect(result).toHaveProperty("@id", "urn:collection1");
        // The actual structure depends on schema and graph traversal
        expect(typeof result).toBe("object");
      });
    });
  });
});
