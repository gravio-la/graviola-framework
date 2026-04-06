import type { JSONSchema7 } from "json-schema";
import dayjs from "dayjs";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import { generateDefaultUISchema } from "@graviola/edb-ui-utils";
import type { SchemaConfig } from "./schemaTypes";
import { exampleDataTurtle } from "./metal-fixture";

const type = (name: string) => ({
  type: "string",
  const: `http://www.example.org/example/${name}`,
});
export const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    Person: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Person"),
        firstName: { type: "string", title: "Vorname" },
        lastName: { type: "string", title: "Nachname" },
        employeeId: { type: "string", title: "Mitarbeiternummer" },
        qualification: {
          type: "string",
          title: "Qualifikation",
          enum: ["Schweißer", "Schweißfachingenieur", "Prüfer", "Meister"],
        },
        designedTemplates: {
          type: "array",
          title: "Entwürfe",
          items: { $ref: "#/definitions/WeldingTemplate" },
          "x-inverseOf": {
            inverseOf: ["#/definitions/WeldingTemplate/properties/designer"],
          },
        },
        certification: {
          type: "array",
          title: "Zertifizierungen",
          items: {
            type: "object",
            properties: {
              type: { type: "string", title: "Art" },
              number: { type: "string", title: "Nummer" },
              validUntil: {
                type: "string",
                format: "date",
                title: "Gültig bis",
              },
            },
          },
        },
      },
      required: ["firstName", "lastName", "employeeId"],
    },
    QualityCheck: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("QualityCheck"),
        type: {
          type: "string",
          title: "Prüfart",
          enum: [
            "Sichtprüfung",
            "Durchstrahlungsprüfung",
            "Ultraschallprüfung",
            "Druckprüfung",
          ],
        },
        result: {
          type: "string",
          title: "Ergebnis",
          enum: ["Bestanden", "Nicht bestanden", "Mit Einschränkungen"],
        },
        inspector: { $ref: "#/definitions/Person", title: "Prüfer" },
        date: { type: "string", format: "date", title: "Prüfdatum" },
        notes: { type: "string", title: "Bemerkungen" },
      },
    },
    Defect: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Defect"),
        type: {
          type: "string",
          title: "Mangelart",
          enum: [
            "Poren",
            "Risse",
            "Schlackeneinschlüsse",
            "Bindefehler",
            "Unterwälzungen",
          ],
        },
        location: { type: "string", title: "Position" },
        severity: {
          type: "string",
          title: "Schweregrad",
          enum: ["Kritisch", "Hoch", "Mittel", "Niedrig"],
        },
        status: {
          type: "string",
          title: "Status",
          enum: ["Offen", "In Bearbeitung", "Behoben", "Nicht behoben"],
        },
        repairMethod: { type: "string", title: "Reparaturmethode" },
        repairDate: { type: "string", format: "date", title: "Reparaturdatum" },
      },
    },
    Documentation: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("Documentation"),
        type: {
          type: "string",
          title: "Dokumenttyp",
          enum: [
            "Schweißanweisung",
            "Prüfbericht",
            "Reparaturbericht",
            "Zertifikat",
          ],
        },
        file: { type: "string", title: "Datei" },
        date: { type: "string", format: "date", title: "Datum" },
      },
    },
    WeldingTemplate: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("WeldingTemplate"),
        name: { type: "string", title: "Bauteilbezeichnung" },
        drawingNumber: { type: "string", title: "Zeichnungsnummer" },
        material: { type: "string", title: "Werkstoff" },
        thickness: { type: "number", title: "Materialstärke (mm)" },
        weldingProcess: {
          type: "string",
          title: "Schweißverfahren",
          enum: ["MIG/MAG", "WIG", "E-Hand", "Unterpulver", "Laser"],
        },
        designer: { $ref: "#/definitions/Person", title: "Designer" },
        // List of derived WeldedComponents (instances)
        weldedComponents: {
          type: "array",
          title: "Abgeleitete Bauteile",
          items: { $ref: "#/definitions/WeldedComponent" },
        },
      },
      required: [
        "name",
        "drawingNumber",
        "material",
        "thickness",
        "weldingProcess",
      ],
    },
    WeldedComponent: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": type("WeldedComponent"),
        // Reference to the template this component is based on
        weldingTemplate: {
          $ref: "#/definitions/WeldingTemplate",
          title: "Schweißvorlage",
          "x-inverseOf": {
            inverseOf: [
              "#/definitions/WeldingTemplate/properties/weldedComponents",
            ],
          },
        },
        uniqueNumber: { type: "string", title: "Seriennummer / Bauteilnummer" },
        partId: { type: "string", title: "Part-ID" },
        // Allow overriding material and weldingProcess
        material: {
          type: "string",
          title: "Werkstoff (Überschreiben möglich)",
        },
        weldingProcess: {
          type: "string",
          title: "Schweißverfahren (Überschreiben möglich)",
          enum: ["MIG/MAG", "WIG", "E-Hand", "Unterpulver", "Laser"],
        },
        welder: { $ref: "#/definitions/Person", title: "Schweißer" },
        weldingDate: { type: "string", format: "date", title: "Schweißdatum" },
        qualityChecks: {
          type: "array",
          title: "Qualitätsprüfungen",
          items: { $ref: "#/definitions/QualityCheck" },
        },
        defects: {
          type: "array",
          title: "Mängel",
          items: { $ref: "#/definitions/Defect" },
        },
        documentation: {
          type: "array",
          title: "Dokumentation",
          items: { $ref: "#/definitions/Documentation" },
        },
      },
      required: ["uniqueNumber", "partId", "weldingDate"],
    },
  },
};

const metalSchema = schema as unknown as JSONSchema7;

export const metalSchemaConfig: SchemaConfig = {
  schemaName: "metal-schema",
  label: "Metal / welding",
  description:
    "Welding templates, welded components, QA checks — demo data for linked-data forms.",
  version: "0.1.0",
  cardImage: "/metal-schema-card.jpg",
  color: "#1565c0",
  icon: "⚙️",
  storageKey: "testapp-metal",
  initialData: exampleDataTurtle,
  baseIRI: "http://www.example.org/",
  entityBaseIRI: "http://www.example.org/example/",
  schema: metalSchema,
  primaryFields: {
    WeldingTemplate: {
      label: "name",
      description: "drawingNumber",
    },
    WeldedComponent: {
      label: "uniqueNumber",
      description: "partId",
    },
    Person: {
      label: "lastName",
      description: "employeeId",
    },
    QualityCheck: {
      label: "type",
      description: "notes",
    },
    Defect: {
      label: "type",
      description: "location",
    },
    Documentation: {
      label: "type",
      description: "file",
    },
  },
  typeNameLabelMap: {
    WeldingTemplate: "Schweißvorlage",
    WeldedComponent: "Geschweißtes Bauteil",
    Person: "Mitarbeiter",
    QualityCheck: "Qualitätsprüfung",
    Defect: "Mangel",
    Documentation: "Dokument",
  },
  typeNameUiSchemaOptionsMap: {
    WeldedComponent: {
      dropdown: true,
    },
    Person: {
      dropdown: true,
    },
  },
  uischemata: {
    WeldingTemplate: generateDefaultUISchema(
      bringDefinitionToTop(metalSchema as any, "WeldingTemplate") as any,
      {
        scopeOverride: {
          "#/properties/weldedComponents": {
            type: "Control",
            scope: "#/properties/weldedComponents",
            options: {
              dropdown: true,
              showCreateButton: true,
              prepareNewEntityData: (parentData: any) => {
                const newData = {
                  material: parentData.material,
                  weldingTemplate: parentData,
                  weldingDate: dayjs().format("YYYY-MM-DD"),
                  uniqueNumber: String(
                    Math.floor(10000000 + Math.random() * 90000000),
                  ),
                  partId: Array.from({ length: 8 }, () =>
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
                  ).join(""),
                };
                return newData;
              },
            },
          },
        },
      },
    ),
    WeldedComponent: generateDefaultUISchema(
      bringDefinitionToTop(metalSchema as any, "WeldedComponent") as any,
      {
        scopeOverride: {
          "#/properties/qualityChecks": {
            type: "Control",
            scope: "#/properties/qualityChecks",
            options: {
              chips: true,
            },
          },
          "#/properties/defects": {
            type: "Control",
            scope: "#/properties/defects",
            label: "Mängelliste",
            options: {
              chips: true,
            },
          },
          "#/properties/welder": {
            type: "Control",
            scope: "#/properties/welder",
            options: {
              dropdown: true,
            },
          },
        },
      },
    ),
  },
};
