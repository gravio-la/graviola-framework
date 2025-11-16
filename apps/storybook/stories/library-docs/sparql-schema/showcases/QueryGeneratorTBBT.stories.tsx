import type { Meta, StoryObj } from "@storybook/react";
import type { JSONSchema7 } from "json-schema";
import { QueryGeneratorWrapper } from "./QueryGeneratorWrapper";
import { tbbtTriples, schemaPrefixes } from "./tbbt-dataset";

const meta: Meta<typeof QueryGeneratorWrapper> = {
  title: "Library Docs/sparql-schema/Query Generator (TBBT Dataset)",
  component: QueryGeneratorWrapper,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    schema: {
      control: "object",
      description: "JSON Schema for the query",
    },
    subjectIRI: {
      control: "text",
      description: "Subject IRI to query",
    },
    filterOptions: {
      control: "object",
      description: "Filter options (include, select, omit)",
    },
    prefixMap: {
      control: "object",
      description: "SPARQL prefix declarations",
    },
  },
};

export default meta;
type Story = StoryObj<typeof QueryGeneratorWrapper>;

// ============================================================================
// Person Schema Definitions
// ============================================================================

const PersonDefinition: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string", const: "schema:Person" },
    "schema:givenName": { type: "string" },
    "schema:familyName": { type: "string" },
    "schema:email": { type: "string" },
    "schema:jobTitle": { type: "string" },
  },
};

const OrganizationDefinition: JSONSchema7 = {
  type: "object",
  properties: {
    "@id": { type: "string" },
    "@type": { type: "string", const: "schema:Organization" },
    "schema:name": { type: "string" },
    "schema:url": { type: "string" },
  },
};

// ============================================================================
// Story 1: Simple Person with Basic Properties
// ============================================================================

export const BasicPerson: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
      },
      ...PersonDefinition,
    },
    subjectIRI: "http://localhost:8080/data/person/leonard-hofstadter",
    filterOptions: {
      select: {
        "@id": true,
        "@type": true,
        "schema:givenName": true,
        "schema:familyName": true,
        "schema:email": true,
      },
    },
    prefixMap: schemaPrefixes,
    title: "TBBT: Basic Person (Leonard)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 2: Person with Single-Level Relationships
// ============================================================================

export const PersonWithKnows: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:email": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/leonard-hofstadter",
    filterOptions: {
      include: {
        "schema:knows": {
          take: 3,
          orderBy: { "schema:givenName": "asc" },
        },
      },
    },
    prefixMap: schemaPrefixes,
    title: "TBBT: Person with 'knows' Relationship (Paginated)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 3: Multi-Level Relationships (Depth 2)
// ============================================================================

export const MultiLevelRelationships: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
        PersonWithKnows: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "schema:givenName": { type: "string" },
            "schema:familyName": { type: "string" },
            "schema:knows": {
              type: "array",
              items: { $ref: "#/$defs/Person" },
            },
          },
        },
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/PersonWithKnows" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/sheldon-cooper",
    filterOptions: {
      include: {
        "schema:knows": {
          take: 4,
          orderBy: { "schema:familyName": "asc" },
        },
      },
    },
    prefixMap: schemaPrefixes,
    title:
      "TBBT: Multi-Level knows (Depth 2, Sheldon → Friends → Their Friends)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 4: Multiple Relationship Types with Different Pagination
// ============================================================================

export const MultipleRelationships: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
        Organization: OrganizationDefinition,
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:email": { type: "string" },
        "schema:jobTitle": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
        "schema:colleague": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
        "schema:worksFor": {
          type: "array",
          items: { $ref: "#/$defs/Organization" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/leonard-hofstadter",
    filterOptions: {
      include: {
        "schema:knows": {
          take: 10,
          orderBy: { "schema:givenName": "asc" },
        },
        "schema:colleague": {
          take: 5,
          orderBy: { "schema:familyName": "desc" },
        },
        "schema:worksFor": {
          take: 1,
        },
      },
    },
    prefixMap: schemaPrefixes,
    title:
      "TBBT: Multiple Relationships (knows, colleague, worksFor) with Different Pagination",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 5: Select & Omit with Relationships
// ============================================================================

export const SelectOmitWithRelationships: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:email": { type: "string" },
        "schema:jobTitle": { type: "string" },
        "schema:telephone": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
        "schema:colleague": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/sheldon-cooper",
    filterOptions: {
      select: {
        "@id": true,
        "schema:givenName": true,
        "schema:familyName": true,
        "schema:jobTitle": true,
        "schema:colleague": true,
      },
      omit: ["schema:email", "schema:telephone"],
      include: {
        "schema:colleague": {
          take: 3,
          orderBy: { "schema:givenName": "asc" },
        },
      },
    },
    prefixMap: schemaPrefixes,
    title:
      "TBBT: Select & Omit (only show name + jobTitle + colleagues, hide email)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 6: Complex Multi-Level with Pagination at Multiple Depths
// ============================================================================

export const ComplexMultiLevel: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
        Organization: OrganizationDefinition,
        PersonWithRelationships: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            "schema:givenName": { type: "string" },
            "schema:familyName": { type: "string" },
            "schema:email": { type: "string" },
            "schema:colleague": {
              type: "array",
              items: { $ref: "#/$defs/Person" },
            },
            "schema:worksFor": {
              type: "array",
              items: { $ref: "#/$defs/Organization" },
            },
          },
        },
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:jobTitle": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/PersonWithRelationships" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/leonard-hofstadter",
    filterOptions: {
      include: {
        "schema:knows": {
          take: 5,
          orderBy: [
            { "schema:familyName": "asc" },
            { "schema:givenName": "asc" },
          ],
        },
      },
    },
    prefixMap: schemaPrefixes,
    title:
      "TBBT: Complex Multi-Level (Leonard → knows → their colleagues & workplaces)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 7: All Scientists at Caltech
// ============================================================================

export const CaltechScientists: Story = {
  args: {
    schema: {
      $defs: {
        Person: PersonDefinition,
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:email": { type: "string" },
        "schema:jobTitle": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/sheldon-cooper",
    filterOptions: {
      select: {
        "@id": true,
        "@type": true,
        "schema:givenName": true,
        "schema:familyName": true,
        "schema:jobTitle": true,
        "schema:knows": true,
      },
      include: {
        "schema:knows": {
          take: 20,
          orderBy: [
            { "schema:jobTitle": "asc" },
            { "schema:givenName": "asc" },
          ],
        },
      },
    },
    prefixMap: schemaPrefixes,
    title: "TBBT: Sheldon's Network (sorted by jobTitle, then name)",
    triples: tbbtTriples,
  },
};

// ============================================================================
// Story 8: Minimal Stub (@id only) for Large Networks
// ============================================================================

export const MinimalStub: Story = {
  args: {
    schema: {
      $defs: {
        PersonStub: {
          type: "object",
          properties: {
            "@id": { type: "string" },
          },
        },
      },
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string" },
        "schema:givenName": { type: "string" },
        "schema:familyName": { type: "string" },
        "schema:knows": {
          type: "array",
          items: { $ref: "#/$defs/PersonStub" },
        },
        "schema:colleague": {
          type: "array",
          items: { $ref: "#/$defs/PersonStub" },
        },
      },
    },
    subjectIRI: "http://localhost:8080/data/person/leonard-hofstadter",
    filterOptions: {
      include: {
        "schema:knows": {
          take: 50,
        },
        "schema:colleague": {
          take: 20,
        },
      },
    },
    prefixMap: schemaPrefixes,
    title: "TBBT: Minimal Stub (@id only) for Performance",
    triples: tbbtTriples,
  },
};
