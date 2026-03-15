/**
 * Tests read (CONSTRUCT) and write (UPDATE) behaviour for x-inverseOf on an array property.
 * Covers jsonSchema2construct only; normalizedSchema2construct does not implement x-inverseOf.
 */
import { describe, expect, test } from "@jest/globals";
import type { JSONSchema7 } from "json-schema";
import { getInverseProperties } from "@graviola/json-schema-utils";
import { removeInversePropertiesFromSchema } from "@graviola/jsonld-utils";
import type { SPARQLCRUDOptions } from "@graviola/edb-core-types";

import { makeSPARQLInverseSyncQuery } from "@/crud/makeSPARQLInverseSyncQuery";
import { jsonSchema2construct } from "./jsonSchema2construct";

const SUBJECT_IRI = "http://example.com/group/1";

/** Minimal schema: Group with members array (x-inverseOf Person.groups) */
const schemaWithInverseArray = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/group.schema.json",
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string" },
    name: { type: "string" },
    members: {
      type: "array",
      items: { $ref: "#/definitions/Person" },
      "x-inverseOf": {
        inverseOf: ["#/definitions/Person/properties/groups"],
      },
    },
  },
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        groups: {
          type: "array",
          items: { $ref: "#/definitions/Group" },
        },
      },
    },
    Group: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        members: {
          type: "array",
          items: { $ref: "#/definitions/Person" },
        },
      },
    },
  },
};

describe("jsonSchema2construct with x-inverseOf array (read/write)", () => {
  describe("CONSTRUCT (read)", () => {
    test("generated construct contains subject and :members predicate", () => {
      const { construct } = jsonSchema2construct(
        SUBJECT_IRI,
        schemaWithInverseArray as any,
      );

      expect(construct).toContain(SUBJECT_IRI);
      expect(construct).toContain(":members");
    });

    test("generated WHERE contains inverse pattern (:groups) and subject", () => {
      const { whereOptionals } = jsonSchema2construct(
        SUBJECT_IRI,
        schemaWithInverseArray as any,
      );

      expect(whereOptionals).toContain(":groups");
      expect(whereOptionals).toContain(SUBJECT_IRI);
    });
  });

  describe("UPDATE (write)", () => {
    test("after removeInversePropertiesFromSchema, construct and WHERE do not contain :members", () => {
      const cleanSchema = removeInversePropertiesFromSchema(
        schemaWithInverseArray as JSONSchema7,
      );
      const { construct, whereOptionals } = jsonSchema2construct(
        SUBJECT_IRI,
        cleanSchema as any,
      );

      expect(construct).not.toContain(":members");
      expect(whereOptionals).not.toContain(":members");
    });
  });

  describe("add entry to inverse list (e.g. add member to Group)", () => {
    const mockOptions: SPARQLCRUDOptions = {
      defaultPrefix: "http://example.com/",
      queryBuildOptions: {
        propertyToIRI: (property: string) => `http://example.com/${property}`,
        typeIRItoTypeName: (iri: string) => iri.split("/").pop() || "",
        primaryFields: [],
        primaryFieldExtracts: [],
        prefixes: { ex: "http://example.com/" },
      },
    };

    test("getInverseProperties + makeSPARQLInverseSyncQuery produces UPDATE that INSERTs subject into each target's inverse property", () => {
      const doc = {
        "@id": SUBJECT_IRI,
        "@type": "Group",
        name: "Dev Group",
        members: [
          { "@id": "http://example.com/person/1" },
          { "@id": "http://example.com/person/2" },
        ],
      };

      const inverseProperties = getInverseProperties(
        schemaWithInverseArray as JSONSchema7,
        schemaWithInverseArray as JSONSchema7,
        doc,
      );
      expect(inverseProperties).toHaveLength(1);
      expect(inverseProperties[0].path).toEqual(["groups"]);
      expect(inverseProperties[0].entityIRIs).toContain(
        "http://example.com/person/1",
      );
      expect(inverseProperties[0].entityIRIs).toContain(
        "http://example.com/person/2",
      );

      const withTypeIRI = inverseProperties.map((inv) => ({
        ...inv,
        typeIRI: "http://example.com/Person",
      }));
      const query = makeSPARQLInverseSyncQuery(
        SUBJECT_IRI,
        withTypeIRI,
        mockOptions,
      );

      expect(query).not.toBeNull();
      expect(query).toContain("INSERT");
      expect(query).toContain(":groups");
      expect(query).toContain(`<${SUBJECT_IRI}>`);
      expect(query).toContain("http://example.com/person/1");
      expect(query).toContain("http://example.com/person/2");
    });
  });
});
