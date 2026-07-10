import { describe, expect, test } from "bun:test";
import {
  baseMetaSchemaProfile,
  buildMetaAnnotationProjections,
  flattenMetaSchemaProfile,
  mergeMetaAnnotationScopes,
  metaSparqlColumnIdToScope,
} from "./index";

describe("meta annotation projections", () => {
  test("buildMetaAnnotationProjections maps UI scopes to SPARQL vars", () => {
    const profile = flattenMetaSchemaProfile(baseMetaSchemaProfile);
    const projections = buildMetaAnnotationProjections(profile, [
      "#/properties/$meta/properties/modified",
      "#/properties/$meta/properties/created",
    ]);

    expect(projections).toHaveLength(2);
    expect(projections[0]?.sparqlVar).toBe("entityMeta_modified_single");
    expect(projections[0]?.persistenceSegments).toEqual([
      "entityMeta",
      "modified",
    ]);
    expect(projections[1]?.sparqlVar).toBe("entityMeta_created_single");
  });

  test("metaSparqlColumnIdToScope inverts leaf column ids", () => {
    expect(metaSparqlColumnIdToScope("entityMeta_modified_single")).toBe(
      "#/properties/$meta/properties/modified",
    );
    expect(metaSparqlColumnIdToScope("name_single")).toBeUndefined();
  });

  test("mergeMetaAnnotationScopes dedupes explicit scopes and sort columns", () => {
    const merged = mergeMetaAnnotationScopes(
      ["#/properties/$meta/properties/created"],
      ["entityMeta_modified_single", "entityMeta_created_single"],
    );
    expect(merged).toEqual([
      "#/properties/$meta/properties/created",
      "#/properties/$meta/properties/modified",
    ]);
  });
});
