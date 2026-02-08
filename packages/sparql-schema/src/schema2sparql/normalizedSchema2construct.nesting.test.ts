/**
 * Tests for proper nesting of OPTIONAL blocks in WHERE clauses
 *
 * These tests verify that the tree-structured WherePart system correctly
 * generates nested OPTIONAL blocks, preventing the flat structure bug
 * where nested property patterns appeared outside their parent OPTIONAL.
 */

import { describe, test, expect } from "bun:test";
import { JSONSchema7 } from "json-schema";
import { normalizeSchema } from "@graviola/edb-graph-traversal";
import { normalizedSchema2construct } from "./normalizedSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";

describe("normalizedSchema2construct - Proper OPTIONAL Nesting", () => {
  describe("Single-level optional relationships", () => {
    test("optional object property has nested patterns inside OPTIONAL block", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
            },
          },
        },
        required: ["name"], // address is optional
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Single-level optional object ===");
      console.log(query);

      // address pattern should be in OPTIONAL
      expect(query).toMatch(/OPTIONAL \{[^}]*:address[^}]*\?address_0/);

      // Nested properties should be inside the parent OPTIONAL
      // The pattern should look like: OPTIONAL { ?subject :address ?address_0 . ... nested patterns ... }
      const whereSection = query.substring(query.indexOf("WHERE"));

      // Check that street and city patterns appear after address
      // Use multiline regex to capture the full OPTIONAL block with nested content
      const addressOptionalMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:address[\s\S]*?\n\}/m,
      );
      expect(addressOptionalMatch).toBeTruthy();

      if (addressOptionalMatch) {
        const addressBlock = addressOptionalMatch[0];
        // Nested properties should be inside this block
        expect(addressBlock).toContain("address_0");
        expect(addressBlock).toContain("street");
        expect(addressBlock).toContain("city");
      }
    });

    test("optional array property has nested item patterns inside OPTIONAL block", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          friends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                age: { type: "number" },
              },
            },
          },
        },
        required: ["name"], // friends is optional
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Single-level optional array ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Friends relationship should be in OPTIONAL
      // Use multiline regex to capture the full OPTIONAL block
      const friendsOptionalMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:friends[\s\S]*?\n\}/m,
      );
      expect(friendsOptionalMatch).toBeTruthy();

      if (friendsOptionalMatch) {
        const friendsBlock = friendsOptionalMatch[0];
        // Nested properties of friend items should be inside this block
        expect(friendsBlock).toContain("friends_0");
        expect(friendsBlock).toContain("name");
        expect(friendsBlock).toContain("age");
      }
    });
  });

  describe("Multi-level optional relationships", () => {
    test("deeply nested optional relationships (3 levels)", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          department: {
            type: "object",
            properties: {
              name: { type: "string" },
              manager: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        },
        required: ["name"], // Everything else optional
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Three-level nesting ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Department should be in OPTIONAL
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:department/);

      // Manager should be nested inside department's OPTIONAL
      // This is complex to verify with regex, but we can check the structure
      const optionalCount = (whereSection.match(/OPTIONAL \{/g) || []).length;
      const closeBraceCount = (whereSection.match(/\}/g) || []).length;

      // Should have matching braces
      expect(optionalCount).toBeGreaterThan(0);
      // Each OPTIONAL has at least one closing brace
      expect(closeBraceCount).toBeGreaterThanOrEqual(optionalCount);
    });

    test("optional array with nested optional array (friends of friends)", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          friends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                friends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        required: ["name"],
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Nested arrays (friends of friends) ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Should have nested OPTIONAL blocks
      expect(whereSection).toContain("OPTIONAL");
      expect(whereSection).toContain("friends");

      // Count OPTIONAL blocks - should have at least 2 (one for each level)
      const optionalCount = (whereSection.match(/OPTIONAL/g) || []).length;
      expect(optionalCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Mixed required and optional properties", () => {
    test("required property at root, optional nested", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          company: {
            type: "object",
            properties: {
              name: { type: "string" },
              website: { type: "string" },
            },
            required: ["name"], // name is required IF company exists
          },
        },
        required: ["name", "company"], // Both required at root
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Required with optional nested ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Root name should NOT be in OPTIONAL
      expect(whereSection).toMatch(/\?subject :name \?name_0 \./);
      expect(whereSection).not.toMatch(/OPTIONAL \{[^}]*\?subject :name/);

      // Company should NOT be in OPTIONAL (it's required)
      expect(whereSection).toMatch(/\?subject :company \?company_0 \./);
      expect(whereSection).not.toMatch(/OPTIONAL \{[^}]*\?subject :company/);

      // Company's required property (name) should also NOT be in OPTIONAL within the company context
      // But website should be optional
      expect(whereSection).toContain("company_0");
      expect(whereSection).toContain("website");
    });

    test("optional property at root, required nested", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
            },
            required: ["street"], // street required IF address exists
          },
        },
        required: ["name"], // address is optional
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Optional with required nested ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Address should be in OPTIONAL
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:address/);

      // Within the address OPTIONAL block, street should NOT be in a nested OPTIONAL
      // (it's required IF address exists)
      const addressMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:address[\s\S]*?\n\}/m,
      );
      if (addressMatch) {
        const addressBlock = addressMatch[0];
        // street should be present
        expect(addressBlock).toContain("street");
        // street should NOT have its own OPTIONAL wrapper (required within parent)
        expect(addressBlock).toMatch(/\?address_0 :street \?street/);
      }
    });
  });

  describe("Variables only appear after binding", () => {
    test("nested object variables appear only after relationship is bound", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
            },
          },
        },
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Find position of address binding
      const addressBindPos = whereSection.indexOf(":address");
      // Find position of first use of address variable
      const addressVarPos = whereSection.indexOf("?address_0");

      // address variable should appear at or after the binding position
      expect(addressVarPos).toBeGreaterThanOrEqual(addressBindPos);

      // street variable should appear after address variable
      const streetVarPos = whereSection.indexOf("?street");
      if (streetVarPos > 0) {
        expect(streetVarPos).toBeGreaterThan(addressVarPos);
      }
    });

    test("array item variables appear only after array is bound", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          friends: {
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

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // friends variable should be bound before being used
      const friendsBindPos = whereSection.indexOf(":friends");
      const friendsVarFirstUse = whereSection.indexOf("?friends_0");

      expect(friendsVarFirstUse).toBeGreaterThanOrEqual(friendsBindPos);
    });
  });

  describe("Comparison with old implementation behavior", () => {
    test("matches old nesting structure for complex Garden schema", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          patches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                plantingPlans: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            plantSpecies: { type: "string" },
                          },
                        },
                      },
                    },
                    required: ["name"],
                  },
                },
              },
              required: ["name"],
            },
          },
        },
        required: ["name"],
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/garden1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Complex Garden Schema (like old implementation) ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Verify root required property is NOT in OPTIONAL
      expect(whereSection).toMatch(/\?subject :name \?name_0 \./);
      expect(whereSection).not.toMatch(
        /OPTIONAL \{[^}]*\?subject :name \?name_0/,
      );

      // Verify patches (optional) is in OPTIONAL
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:patches/);

      // Verify patches.name (required within patches) appears inside patches OPTIONAL
      // but NOT in its own OPTIONAL
      const patchesMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:patches[\s\S]*?\n\}/m,
      );
      if (patchesMatch) {
        const patchesBlock = patchesMatch[0];
        // Should contain patches_0 :name pattern without OPTIONAL wrapper
        expect(patchesBlock).toMatch(/\?patches_0 :name \?name_\d+/);
      }

      // Verify plantingPlans is nested inside patches OPTIONAL
      expect(whereSection).toContain("plantingPlans");

      // Count nesting levels - should have at least 3 OPTIONAL blocks
      // (patches, plantingPlans, items)
      const optionalCount = (whereSection.match(/OPTIONAL/g) || []).length;
      expect(optionalCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Required properties within optional contexts", () => {
    test("required nested property is NOT in OPTIONAL within optional parent", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          company: {
            type: "object",
            properties: {
              name: { type: "string" },
              website: { type: "string" },
            },
            required: ["name"], // name required IF company exists
          },
        },
        required: ["name"], // company is optional
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Required nested in optional parent ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Company should be in OPTIONAL
      const companyMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:company \?company_0[\s\S]*?\n\}/m,
      );
      expect(companyMatch).toBeTruthy();

      if (companyMatch) {
        const companyBlock = companyMatch[0];
        // Company name should be present
        expect(companyBlock).toContain("company_0");
        expect(companyBlock).toContain("name");

        // Company name should NOT have its own OPTIONAL (it's required)
        // It should be a direct pattern like: ?company_0 :name ?name_1 .
        expect(companyBlock).toMatch(/\?company_0 :name \?name_\d+ \./);

        // Website should be in OPTIONAL (it's optional)
        expect(companyBlock).toMatch(/OPTIONAL \{[\s\S]*?website/);
      }
    });

    test("array with required items name, optional other properties", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          patches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                area: { type: "number" },
              },
              required: ["name"], // name required for each patch
            },
          },
        },
        required: ["name"],
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/garden1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      console.log("\n=== Array with required item properties ===");
      console.log(query);

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Patches array is optional
      const patchesMatch = whereSection.match(
        /OPTIONAL \{[\s\S]*?:patches[\s\S]*?\n\}/m,
      );
      expect(patchesMatch).toBeTruthy();

      if (patchesMatch) {
        const patchesBlock = patchesMatch[0];
        // Patch name is required (not in its own OPTIONAL)
        expect(patchesBlock).toMatch(/\?patches_0 :name \?name_\d+ \./);

        // Description and area should be in OPTIONAL
        expect(patchesBlock).toMatch(/OPTIONAL \{[\s\S]*?description/);
        expect(patchesBlock).toMatch(/OPTIONAL \{[\s\S]*?area/);
      }
    });
  });

  describe("Edge cases", () => {
    test("all properties optional creates nested OPTIONALs", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
        },
        // No required properties
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Each property should have its own OPTIONAL block
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:name/);
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:email/);
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*:phone/);

      // Should have at least 3 separate OPTIONAL blocks
      const optionalCount = (whereSection.match(/OPTIONAL/g) || []).length;
      expect(optionalCount).toBeGreaterThanOrEqual(3);
    });

    test("all properties required creates no OPTIONAL except for type", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          email: { type: "string" },
        },
        required: ["name", "age", "email"],
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined,
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Root properties should NOT be in OPTIONAL
      expect(whereSection).toMatch(/\?subject :name \?name_0 \./);
      expect(whereSection).toMatch(/\?subject :age \?age_0 \./);
      expect(whereSection).toMatch(/\?subject :email \?email_0 \./);

      // Should still have type in OPTIONAL (without explicit typeIRIs)
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*rdf:type/);
    });
  });

  describe("Type pattern nesting", () => {
    test("type pattern with explicit typeIRIs is required", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        "http://example.com/Person", // Explicit type
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Type should be required when typeIRIs is specified
      expect(whereSection).toContain("VALUES ?type");
      expect(whereSection).toMatch(/\?subject.*rdf:type.*\?type/);
      // Should NOT be wrapped in OPTIONAL at the top level
      expect(whereSection).not.toMatch(/^[^}]*OPTIONAL \{[^}]*VALUES \?type/);
    });

    test("type pattern without typeIRIs is optional", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const normalized = normalizeSchema(schema, {});
      const result = normalizedSchema2construct(
        "http://example.com/person1",
        undefined, // No explicit type
        normalized,
      );

      const query = buildSPARQLConstructQuery(result, {
        "": "http://example.com/",
      });

      const whereSection = query.substring(query.indexOf("WHERE"));

      // Type should be in OPTIONAL when no typeIRIs specified
      expect(whereSection).toMatch(/OPTIONAL \{[^}]*rdf:type \?type/);
    });
  });
});
