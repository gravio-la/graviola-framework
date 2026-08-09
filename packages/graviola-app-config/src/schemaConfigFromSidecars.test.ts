import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import type { Layout } from "@jsonforms/core";
import {
  schemaConfigFromSidecars,
  defineGraviolaApp,
} from "./defineGraviolaApp";
import type { GraviolaSideSchema } from "./types";

const schema = {
  type: "object",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        lastName: { type: "string" },
        firstName: { type: "string" },
        employeeId: { type: "string" },
      },
    },
    Item: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        name: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
} as JSONSchema7;

const sideSchema: GraviolaSideSchema = {
  schemaName: "metal-schema",
  label: "Metal / welding",
  description: "demo",
  version: "0.1.0",
  color: "#1565c0",
  icon: "⚙️",
  storageKey: "testapp-metal",
  baseIRI: "http://www.example.org/",
  entityBaseIRI: "http://www.example.org/example/",
  primaryFields: {
    Person: { label: "lastName", description: "employeeId" },
  },
  typeNameLabelMap: {
    Person: "Mitarbeiter",
    Item: "Artikel",
  },
  typeNameUiSchemaOptionsMap: {
    Person: { dropdown: true },
  },
  uischemaScopeOverrides: {
    Person: {
      mode: "exclusive",
      scopeOverride: {
        "#/properties/lastName": {
          type: "Control",
          scope: "#/properties/lastName",
          label: "Nachname",
        },
        "#/properties/employeeId": {
          type: "Control",
          scope: "#/properties/employeeId",
        },
      },
    },
    Item: {
      mode: "override",
      scopeOverride: {
        "#/properties/tags": {
          type: "Control",
          scope: "#/properties/tags",
          options: { chips: true },
        },
      },
    },
  },
  menuUISchema: {
    Person: { title: "Mitarbeiter", editable: true },
  },
  menuSidebarConfig: {
    prioritizedDefinitions: ["Person"],
    hiddenDefinitions: ["Item"],
  },
};

describe("schemaConfigFromSidecars", () => {
  test("compiles exclusive and override form UISchemas from JSON sidecars", () => {
    const config = schemaConfigFromSidecars({ schema, sideSchema });

    expect(config.schemaName).toBe("metal-schema");
    expect(config.primaryFields.Person?.label).toBe("lastName");
    expect(config.menuUISchema?.Person?.title).toBe("Mitarbeiter");

    const personUi = config.uischemata?.Person as Layout;
    expect(personUi.elements).toHaveLength(2);
    expect(
      personUi.elements.map((e) => (e as { scope: string }).scope),
    ).toEqual(["#/properties/lastName", "#/properties/employeeId"]);

    const itemUi = config.uischemata?.Item as Layout;
    const itemScopes = itemUi.elements
      .filter((e) => (e as { scope?: string }).scope)
      .map((e) => (e as { scope: string }).scope);
    expect(itemScopes).toContain("#/properties/name");
    expect(itemScopes).toContain("#/properties/tags");
  });

  test("defineGraviolaApp is an alias of makeSchemaConfig path", () => {
    const config = defineGraviolaApp({
      schemaName: "x",
      label: "X",
      description: "",
      version: "0",
      storageKey: "x",
      baseIRI: "http://example.org/",
      entityBaseIRI: "http://example.org/",
      schema,
      primaryFields: {},
      typeNameLabelMap: {},
      typeNameUiSchemaOptionsMap: {},
      uischemaScopeOverrides: sideSchema.uischemaScopeOverrides,
    });
    expect(config.uischemata?.Person).toBeDefined();
  });

  test("attaches validated searchFacetSchema from sidecar", () => {
    const config = schemaConfigFromSidecars({
      schema,
      sideSchema,
      searchFacet: {
        fulltextIndex: {
          scopes: {
            "#/definitions/Person/properties/lastName": {},
          },
          types: {
            Person: { searchable: true },
          },
        },
        facets: {
          scopes: {
            "#/definitions/Item/properties/tags": { facet: "filter" },
          },
        },
      },
    });
    expect(config.searchFacetSchema?.fulltextIndex?.types?.Person).toEqual({
      searchable: true,
    });
    expect(
      config.searchFacetSchema?.facets?.scopes?.[
        "#/definitions/Item/properties/tags"
      ],
    ).toEqual({ facet: "filter" });
  });
});
