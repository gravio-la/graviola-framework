import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import type { ControlElement, Layout } from "@jsonforms/core";
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

  test("keeps defaults from side schema", () => {
    const config = schemaConfigFromSidecars({
      schema,
      sideSchema: {
        schemaName: "derived",
        defaults: {
          ZutatInRezept: {
            einheit: { path: ["zutatRef", "standardEinheit"] },
          },
        },
      },
    });
    expect(config.defaults?.ZutatInRezept?.einheit).toEqual({
      path: ["zutatRef", "standardEinheit"],
    });
  });

  test("keeps orderBy from side schema", () => {
    const config = schemaConfigFromSidecars({
      schema,
      sideSchema: {
        schemaName: "ordered",
        orderBy: {
          Item: {
            tags: { field: "label", direction: "desc" },
          },
        },
      },
    });
    expect(config.orderBy?.Item?.tags).toEqual({
      field: "label",
      direction: "desc",
    });
  });

  test("generates form uischema from detailUiSchemaScopeOverrides when form override is absent", () => {
    const nestedSchema = {
      type: "object",
      definitions: {
        Rezept: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            zutaten: {
              type: "array",
              items: { $ref: "#/definitions/ZutatInRezept" },
            },
          },
        },
        ZutatInRezept: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            menge: { type: "string" },
            einheit: { type: "string" },
          },
        },
      },
    } as JSONSchema7;

    const config = defineGraviolaApp({
      schemaName: "kochbuch",
      label: "Kochbuch",
      description: "",
      version: "0.1.0",
      storageKey: "kochbuch",
      baseIRI: "http://example.org/",
      entityBaseIRI: "http://example.org/",
      schema: nestedSchema,
      primaryFields: {},
      typeNameLabelMap: {},
      typeNameUiSchemaOptionsMap: {},
      detailUiSchemaScopeOverrides: {
        ZutatInRezept: {
          mode: "override",
          scopeOverride: {
            "#/properties/menge": {
              type: "Control",
              scope: "#/properties/menge",
              rank: 1,
            },
            "#/properties/einheit": {
              type: "Control",
              scope: "#/properties/einheit",
              rank: 2,
            },
          },
        },
      },
    });

    const ui = config.uischemata?.ZutatInRezept as Layout;
    expect(ui).toBeDefined();
    expect(
      ui.elements
        .map((e) => (e as { scope: string }).scope)
        .filter(
          (scope) =>
            scope !== "#/properties/@id" && scope !== "#/properties/@type",
        ),
    ).toEqual(["#/properties/menge", "#/properties/einheit"]);
  });

  test("defineGraviolaApp generates form uischema with options.linkFilter from side schema", () => {
    const bookingSchema = {
      type: "object",
      definitions: {
        Booking: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            host: { $ref: "#/definitions/Host" },
            guest: { $ref: "#/definitions/Guest" },
          },
        },
        Host: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            tier: { type: "string" },
          },
        },
        Guest: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
            tier: { type: "string" },
          },
        },
      },
    } as JSONSchema7;

    const filter = {
      where: { tier: { equals: { $data: "host.tier" } } },
    };

    const config = defineGraviolaApp({
      schemaName: "booking",
      label: "Booking",
      description: "",
      version: "0.1.0",
      storageKey: "booking",
      baseIRI: "http://example.org/",
      entityBaseIRI: "http://example.org/",
      schema: bookingSchema,
      primaryFields: {},
      typeNameLabelMap: {},
      typeNameUiSchemaOptionsMap: {},
      linkFilters: {
        Booking: { guest: filter },
      },
    });

    const bookingUi = config.uischemata?.Booking as Layout;
    const guestControl = bookingUi.elements.find(
      (e) => (e as ControlElement).scope === "#/properties/guest",
    ) as ControlElement;
    expect(guestControl?.options?.linkFilter).toEqual(filter);
  });

  test("schemaConfigFromSidecars threads linkFilters into control options", () => {
    const bookingSchema = {
      type: "object",
      definitions: {
        Booking: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            guest: { $ref: "#/definitions/Guest" },
          },
        },
        Guest: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            tier: { type: "string" },
          },
        },
      },
    } as JSONSchema7;

    const config = schemaConfigFromSidecars({
      schema: bookingSchema,
      sideSchema: {
        schemaName: "booking",
        linkFilters: {
          Booking: {
            guest: { where: { tier: { equals: "gold" } } },
          },
        },
      },
    });

    expect(config.linkFilters?.Booking?.guest?.where).toEqual({
      tier: { equals: "gold" },
    });
    const guestControl = (config.uischemata?.Booking as Layout).elements.find(
      (e) => (e as ControlElement).scope === "#/properties/guest",
    ) as ControlElement;
    expect(guestControl?.options?.linkFilter).toEqual({
      where: { tier: { equals: "gold" } },
    });
  });

  test("defineGraviolaApp generates form uischema with options.orderBy for orderBy-only classes", () => {
    const orderedSchema = {
      type: "object",
      definitions: {
        Rezept: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            titel: { type: "string" },
            schritte: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reihenfolge: { type: "integer" },
                  text: { type: "string" },
                },
              },
            },
          },
        },
        Other: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    } as JSONSchema7;

    const config = defineGraviolaApp({
      schemaName: "kochbuch",
      label: "Kochbuch",
      description: "",
      version: "0.1.0",
      storageKey: "kochbuch",
      baseIRI: "http://example.org/",
      entityBaseIRI: "http://example.org/",
      schema: orderedSchema,
      primaryFields: {},
      typeNameLabelMap: {},
      typeNameUiSchemaOptionsMap: {},
      orderBy: {
        Rezept: {
          schritte: { field: "reihenfolge", direction: "asc" },
        },
      },
    });

    expect(config.uischemata?.Other).toBeUndefined();

    const rezeptUi = config.uischemata?.Rezept as Layout;
    const schritteControl = rezeptUi.elements.find(
      (e) => (e as ControlElement).scope === "#/properties/schritte",
    ) as ControlElement;
    expect(schritteControl?.options?.orderBy).toEqual({
      field: "reihenfolge",
      direction: "asc",
    });
    expect(schritteControl?.options?.showSortButtons).toBe(true);
  });

  test("defineGraviolaApp generates detail uischema with options.orderBy for orderBy-only classes", () => {
    const orderedSchema = {
      type: "object",
      definitions: {
        Zubereitungsgruppe: {
          type: "object",
          properties: {
            name: { type: "string" },
            schritte: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reihenfolge: { type: "integer" },
                  text: { type: "string" },
                },
              },
            },
          },
        },
      },
    } as JSONSchema7;

    const config = defineGraviolaApp({
      schemaName: "kochbuch",
      label: "Kochbuch",
      description: "",
      version: "0.5.0",
      storageKey: "kochbuch",
      baseIRI: "http://example.org/",
      entityBaseIRI: "http://example.org/",
      schema: orderedSchema,
      primaryFields: {},
      typeNameLabelMap: {},
      typeNameUiSchemaOptionsMap: {},
      orderBy: {
        Zubereitungsgruppe: {
          schritte: { field: "reihenfolge", direction: "asc" },
        },
      },
    });

    const groupUi = config.detailUiSchemata?.Zubereitungsgruppe as Layout;
    const schritteControl = groupUi.elements.find(
      (e) => (e as ControlElement).scope === "#/properties/schritte",
    ) as ControlElement;
    expect(schritteControl?.options?.orderBy).toEqual({
      field: "reihenfolge",
      direction: "asc",
    });
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
