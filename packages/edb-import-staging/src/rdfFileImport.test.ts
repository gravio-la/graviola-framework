import { describe, expect, test } from "bun:test";
import {
  BASE_IRI,
  schema,
  typeIRItoTypeName,
} from "@graviola/edb-import-demo-schema";
import type { JSONSchema7 } from "json-schema";
import { createStagedChangeSet } from "./createStagedChangeSet";
import { stageRdfIntoChangeSet } from "./rdfFileImport";

const propertyToIRI = (name: string) => `${BASE_IRI}${name}`;

const EXAMPLE_TURTLE = `@prefix ex: <http://ontologies.slub-dresden.de/exhibition#> .
@prefix entity: <http://ontologies.slub-dresden.de/exhibition/entity/> .

entity:person-goethe a ex:Person ;
  ex:name "Johann Wolfgang von Goethe" ;
  ex:birthPlace entity:place-frankfurt .

entity:person-schiller a ex:Person ;
  ex:name "Friedrich Schiller" .

entity:place-frankfurt a ex:Place ;
  ex:title "Frankfurt am Main" .
`;

describe("stageRdfIntoChangeSet", () => {
  test("parses turtle, extracts typed entities, and stages root + child links", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const staged = await stageRdfIntoChangeSet({
      changeSet,
      content: EXAMPLE_TURTLE,
      sourceRef: "example-import.ttl",
      schema: schema as JSONSchema7,
      baseIRI: BASE_IRI,
      typeNameToTypeIRI: (typeName) => `${BASE_IRI}${typeName}`,
      timestamp: "2026-07-03T12:00:00.000Z",
    });

    expect(staged).toHaveLength(3);
    expect(changeSet.list()).toHaveLength(3);

    const persons = changeSet
      .list()
      .filter((entity) => typeIRItoTypeName(entity.typeIRI) === "Person");
    expect(persons).toHaveLength(2);
    expect(changeSet.roots()).toHaveLength(2);

    const place = changeSet.get(
      "http://ontologies.slub-dresden.de/exhibition/entity/place-frankfurt",
    );
    expect(place).toBeDefined();
    expect(typeIRItoTypeName(place!.typeIRI)).toBe("Place");
    expect(place!.parentIRI).toBe(
      "http://ontologies.slub-dresden.de/exhibition/entity/person-goethe",
    );
    expect(place!.depth).toBe(1);
    expect(place!.provenance.method).toBe("file-import");
    expect(place!.provenance.sourceRef).toBe("example-import.ttl");
    expect(place!.trace.decision).toBe("created");
    expect(place!.trace.mappingPath).toEqual([]);

    const goethe = changeSet.get(
      "http://ontologies.slub-dresden.de/exhibition/entity/person-goethe",
    );
    expect(goethe?.document.birthPlace).toMatchObject({
      "@id":
        "http://ontologies.slub-dresden.de/exhibition/entity/place-frankfurt",
    });
  });
});
