import type { SecondaryDataSourceDeclaration } from "./types";

export const wikidataSourceTemplate = (): SecondaryDataSourceDeclaration => ({
  id: "wikidata",
  label: "Wikidata",
  description: "Wikimedia Wikidata — reconcile suggest + EntityData API",
  authorityIRI: "http://www.wikidata.org",
  enabled: true,
  kind: "declarative",
  typeHints: {
    Person: "Q5",
    Place: "Q2221906",
    Location: "Q2221906",
    Corporation: "Q4830453",
    Exhibition: "Q464980",
  },
  operations: {
    search: {
      id: "wikidata-search",
      kind: "rest",
      method: "GET",
      url: "https://wikidata.reconci.link/en/suggest/entity",
      query: {
        prefix: { kind: "path", from: "input", path: "q", required: true },
        type: { kind: "path", from: "input", path: "type" },
      },
      itemsPath: "result",
      labelPath: "name",
      idPath: "id",
      descriptionPath: "description",
    },
    getEntity: {
      id: "wikidata-entity",
      kind: "rest",
      method: "GET",
      url: "https://www.wikidata.org/w/api.php",
      query: {
        action: { kind: "const", value: "wbgetentities" },
        ids: { kind: "path", from: "input", path: "id", required: true },
        format: { kind: "const", value: "json" },
        props: { kind: "const", value: "labels|descriptions|claims|sitelinks" },
      },
      documentPath: "entities",
    },
    factsPreview: {
      paths: {
        Label: "labels.en.value",
        Description: "descriptions.en.value",
        Birth: "claims.P569[0].mainsnak.datavalue.value.time",
        Death: "claims.P570[0].mainsnak.datavalue.value.time",
      },
    },
  },
  identifiers: [
    {
      path: "claims.P227[0].mainsnak.datavalue.value",
      authorityIRI: "http://d-nb.info/gnd",
      iriTemplate: "http://d-nb.info/gnd/{{id}}",
    },
  ],
  examples: [
    {
      id: "search-picasso",
      label: "Search Picasso",
      operation: "search",
      input: { q: "Picasso", targetType: "Person", limit: 5 },
      expect: { minItems: 1, containsId: "Q5593" },
    },
  ],
});

export const gndSourceTemplate = (): SecondaryDataSourceDeclaration => ({
  id: "gnd",
  label: "GND (lobid)",
  description: "Gemeinsame Normdatei via lobid.org",
  authorityIRI: "http://d-nb.info/gnd",
  enabled: true,
  kind: "declarative",
  typeHints: {
    Person: "Person",
    Place: "PlaceOrGeographicName",
    Corporation: "CorporateBody",
  },
  operations: {
    search: {
      id: "gnd-search",
      kind: "rest",
      method: "GET",
      url: "https://lobid.org/gnd/search",
      query: {
        q: { kind: "path", from: "input", path: "q", required: true },
        format: { kind: "const", value: "json:suggest" },
        size: { kind: "path", from: "input", path: "limit", default: 10 },
      },
      itemsPath: "suggestions",
      labelPath: "label",
      idPath: "id",
    },
    getEntity: {
      id: "gnd-entity",
      kind: "rest",
      method: "GET",
      url: "https://lobid.org/gnd/{{id}}.json",
      params: {
        id: { kind: "path", from: "input", path: "id", required: true },
      },
      idToIri: "http://d-nb.info/gnd/{{id}}",
    },
    factsPreview: {
      paths: {
        Name: "preferredName",
        Birth: "dateOfBirth",
        Death: "dateOfDeath",
      },
    },
  },
  examples: [
    {
      id: "gnd-search-picasso",
      label: "GND search Picasso",
      operation: "search",
      input: { q: "Picasso", limit: 5 },
      expect: { minItems: 1 },
    },
  ],
});

export const sourceTemplates: Record<
  string,
  () => SecondaryDataSourceDeclaration
> = {
  wikidata: wikidataSourceTemplate,
  gnd: gndSourceTemplate,
};
