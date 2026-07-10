import { describe, expect, test } from "bun:test";
import type { MetaAnnotationProjection } from "@graviola/meta-schema";

import { annotationProjectionsToSparql } from "./annotationProjectionsToSparql";

describe("annotationProjectionsToSparql", () => {
  test("emits OPTIONAL entityMeta patterns and SAMPLE aggregates", () => {
    const projections: MetaAnnotationProjection[] = [
      {
        scope: "#/properties/$meta/properties/modified",
        persistenceSegments: ["entityMeta", "modified"],
        sparqlVar: "entityMeta_modified_single",
        leafKey: "modified",
        format: "date-time",
      },
    ];

    const { select, where } = annotationProjectionsToSparql(projections);

    expect(where).toContain("OPTIONAL");
    expect(where).toContain("?entity :entityMeta ?entityMeta");
    expect(where).toContain("?entityMeta :modified ?entityMeta_modified");
    expect(select).toContain(
      "(SAMPLE(?entityMeta_modified) AS ?entityMeta_modified_single)",
    );
  });
});
