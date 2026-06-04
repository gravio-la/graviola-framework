import type { JSONSchema7 } from "json-schema";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";

import { SEMANTIC_VIEWS_EXAMPLE_NS } from "./semanticViewsStorySchema";

export { SEMANTIC_VIEWS_EXAMPLE_NS };

const typeConst = (name: string) => ({
  type: "string" as const,
  const: `${SEMANTIC_VIEWS_EXAMPLE_NS}${name}`,
});

export const relationChipsStorySchema: JSONSchema7 = {
  type: "object",
  definitions: {
    Realm: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Realm"),
        realmName: { type: "string" },
      },
    },
    Artifact: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Artifact"),
        documentTitle: { type: "string" },
      },
    },
    Manifestation: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": typeConst("Manifestation"),
        filePath: { type: "string" },
        inRealm: { $ref: "#/definitions/Realm" },
        manifestationOf: { $ref: "#/definitions/Artifact" },
        tags: {
          type: "array",
          items: { $ref: "#/definitions/Artifact" },
        },
      },
    },
  },
};

export const relationChipsPrimaryFields = {
  Manifestation: { label: "filePath" },
  Realm: { label: "realmName" },
  Artifact: { label: "documentTitle" },
};

const realmControl: ControlElement = {
  type: "Control",
  scope: "#/properties/inRealm",
  label: "In Realm",
  options: { containedAs: "chip" },
};

const artifactControl: ControlElement = {
  type: "Control",
  scope: "#/properties/manifestationOf",
  label: "Manifestation Of",
  options: { containedAs: "chip" },
};

const tagsControl: ControlElement = {
  type: "Control",
  scope: "#/properties/tags",
  label: "Related artifacts",
  options: { containedAs: "chip" },
};

export const manifestationRelationDetailUiSchema: UISchemaElement = {
  type: "TopLevelLayout",
  elements: [
    {
      type: "VerticalLayout",
      elements: [realmControl, artifactControl, tagsControl],
    },
  ],
};

export const sampleManifestationWithRelations = {
  "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Manifestation`,
  "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}manifestation/demo`,
  filePath: "/data/public/music/demo.jpg",
  inRealm: {
    "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Realm`,
    "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}realm/75`,
    realmName: "Workstation NAS",
  },
  manifestationOf: {
    "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Artifact`,
    "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}artifact/abc123`,
    documentTitle: "Album cover image",
  },
  tags: [
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Artifact`,
      "@id": `${SEMANTIC_VIEWS_EXAMPLE_NS}artifact/tag1`,
      documentTitle: "Duplicate hash match",
    },
    {
      "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}Artifact`,
      documentTitle: "Anonymous typed node",
    },
  ],
};

export function relationChipsTypeNameToTypeIRI(typeName: string): string {
  return `${SEMANTIC_VIEWS_EXAMPLE_NS}${typeName}`;
}

export function relationChipsTypeIRIToTypeName(
  iri: string,
): string | undefined {
  if (!iri.startsWith(SEMANTIC_VIEWS_EXAMPLE_NS)) return undefined;
  return iri.slice(SEMANTIC_VIEWS_EXAMPLE_NS.length);
}
