import type { Meta, StoryObj } from "@storybook/react";
import type { Prefixes } from "@graviola/edb-core-types";
import { QueryGeneratorWrapper } from "./QueryGeneratorWrapper";

const meta: Meta<typeof QueryGeneratorWrapper> = {
  title: "Library Docs/sparql-schema/Query Generator (Examples)",
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

const defaultPrefixes: Prefixes = {
  "": "http://example.com/",
  foaf: "http://xmlns.com/foaf/0.1/",
  schema: "http://schema.org/",
};

export const SimpleObject: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {},
    prefixMap: defaultPrefixes,
    title: "Simple Object - No Filters",
  },
};

export const WithPagination: Story = {
  args: {
    schema: {
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
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    },
    prefixMap: defaultPrefixes,
    title: "Array with Pagination (10 items, ordered by name)",
  },
};

export const WithMultipleOrderBy: Story = {
  args: {
    schema: {
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
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {
      include: {
        friends: {
          take: 5,
          orderBy: [{ age: "asc" }, { name: "desc" }],
        },
      },
    },
    prefixMap: defaultPrefixes,
    title: "Multiple ORDER BY Criteria (age ASC, name DESC)",
  },
};

export const NestedObjects: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        employer: {
          type: "object",
          properties: {
            name: { type: "string" },
            industry: { type: "string" },
            address: {
              type: "object",
              properties: {
                city: { type: "string" },
                country: { type: "string" },
              },
            },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {},
    prefixMap: defaultPrefixes,
    title: "Nested Objects (no arrays)",
  },
};

export const WithReferences: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        friends: {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {
      include: {
        friends: {
          take: 15,
          orderBy: { name: "asc" },
        },
      },
    },
    prefixMap: defaultPrefixes,
    title: "Schema with $ref Resolution",
  },
};

export const SelectAndOmit: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        age: { type: "number" },
        friends: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {
      select: { name: true, age: true, friends: true },
      omit: ["password"],
      include: {
        friends: {
          take: 5,
        },
      },
    },
    prefixMap: defaultPrefixes,
    title: "Using select and omit Filters",
  },
};

export const CustomPrefixes: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        "foaf:name": { type: "string" },
        "schema:jobTitle": { type: "string" },
        "dc:created": { type: "string" },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {},
    prefixMap: {
      "": "http://example.com/",
      foaf: "http://xmlns.com/foaf/0.1/",
      schema: "http://schema.org/",
      dc: "http://purl.org/dc/terms/",
    },
    title: "Custom Prefix Resolution",
  },
};

export const SocialNetwork: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        knows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
        worksBy: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              title: { type: "string" },
            },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/sheldon",
    filterOptions: {
      include: {
        knows: {
          take: 20,
          orderBy: { name: "asc" },
        },
        worksBy: {
          take: 5,
        },
      },
    },
    prefixMap: {
      "": "http://example.com/",
      foaf: "http://xmlns.com/foaf/0.1/",
    },
    title: "Social Network (knows + worksBy relationships)",
  },
};

export const ComplexFiltering: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        givenName: { type: "string" },
        familyName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        birthDate: { type: "string" },
        colleagues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              givenName: { type: "string" },
              familyName: { type: "string" },
              department: { type: "string" },
              role: { type: "string" },
            },
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "string" },
              startDate: { type: "string" },
            },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/leonard",
    filterOptions: {
      select: {
        givenName: true,
        familyName: true,
        colleagues: true,
        projects: true,
      },
      omit: ["phone", "birthDate"],
      include: {
        colleagues: {
          take: 8,
          orderBy: [{ department: "asc" }, { familyName: "asc" }],
        },
        projects: {
          take: 3,
          orderBy: { startDate: "desc" },
        },
      },
    },
    prefixMap: {
      "": "http://example.com/",
      foaf: "http://xmlns.com/foaf/0.1/",
      schema: "http://schema.org/",
    },
    title:
      "Complex Filtering (select, omit, multiple includes with pagination)",
  },
};
