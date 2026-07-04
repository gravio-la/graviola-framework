import { describe, expect, test } from "bun:test";
import { DataFactory } from "n3";
import { createStagedChangeSet } from "./createStagedChangeSet";
import type { ChangeSetEvent } from "./types";

const { namedNode } = DataFactory;
const BASE = "http://example.org/";
const propertyToIRI = (name: string) => `${BASE}${name}`;

const baseProvenance = {
  method: "manual" as const,
  timestamp: new Date().toISOString(),
};

const baseTrace = {
  mappingPath: [] as string[],
  decision: "created" as const,
};

describe("createStagedChangeSet", () => {
  test("stages entities with parent links, merge, review, apply, discard", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const events: ChangeSetEvent[] = [];
    changeSet.subscribe((event) => events.push(event));

    const rootIRI = `${BASE}root`;
    const childIRI = `${BASE}child`;
    const grandchildIRI = `${BASE}grandchild`;

    await changeSet.stage({
      entityIRI: rootIRI,
      typeIRI: `${BASE}Person`,
      document: { "@id": rootIRI, "@type": `${BASE}Person`, name: "Root" },
      provenance: baseProvenance,
      trace: baseTrace,
    });
    await changeSet.stage({
      entityIRI: childIRI,
      typeIRI: `${BASE}Place`,
      document: { "@id": childIRI, "@type": `${BASE}Place`, title: "Child" },
      provenance: baseProvenance,
      trace: { ...baseTrace, mappingPath: ["birthPlace"] },
      parentIRI: rootIRI,
    });
    await changeSet.stage({
      entityIRI: grandchildIRI,
      typeIRI: `${BASE}Location`,
      document: {
        "@id": grandchildIRI,
        "@type": `${BASE}Location`,
        title: "Grandchild",
      },
      provenance: baseProvenance,
      trace: { ...baseTrace, mappingPath: ["birthPlace", "location"] },
      parentIRI: childIRI,
    });

    expect(changeSet.list().map((e) => e.entityIRI)).toEqual([
      rootIRI,
      childIRI,
      grandchildIRI,
    ]);
    expect(changeSet.roots().map((e) => e.entityIRI)).toEqual([rootIRI]);
    expect(changeSet.childrenOf(rootIRI).map((e) => e.entityIRI)).toEqual([
      childIRI,
    ]);
    expect(changeSet.childrenOf(childIRI).map((e) => e.entityIRI)).toEqual([
      grandchildIRI,
    ]);

    await changeSet.stage({
      entityIRI: childIRI,
      typeIRI: `${BASE}Place`,
      document: {
        "@id": childIRI,
        "@type": `${BASE}Place`,
        title: "Child merged",
        description: "updated",
      },
      provenance: baseProvenance,
      trace: baseTrace,
      parentIRI: rootIRI,
    });
    expect(events.some((e) => e.kind === "updated")).toBe(true);
    expect(changeSet.get(childIRI)?.document.title).toBe("Child merged");
    expect(changeSet.get(childIRI)?.document.description).toBe("updated");

    changeSet.setReviewState(grandchildIRI, "rejected");
    expect(events.some((e) => e.kind === "review-changed")).toBe(true);

    const upsertOrder: string[] = [];
    const applied = await changeSet.applyAll(
      {
        upsert: async (_typeName, iri) => {
          upsertOrder.push(iri);
        },
      },
      (typeIRI) => typeIRI.replace(BASE, ""),
    );

    expect(applied).toEqual([rootIRI, childIRI]);
    expect(upsertOrder).toEqual([rootIRI, childIRI]);
    expect(events.some((e) => e.kind === "apply-progress")).toBe(true);
    expect(events.some((e) => e.kind === "applied")).toBe(true);

    changeSet.discard();
    expect(changeSet.list()).toEqual([]);
    expect(changeSet.dataset.size).toBe(0);
    expect(events.some((e) => e.kind === "discarded")).toBe(true);
  });

  test("reparent moves entity and fixes subtree depths", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const rootIRI = `${BASE}root`;
    const middleIRI = `${BASE}middle`;
    const leafIRI = `${BASE}leaf`;

    await changeSet.stage({
      entityIRI: rootIRI,
      typeIRI: `${BASE}Person`,
      document: { "@id": rootIRI, "@type": `${BASE}Person`, name: "Root" },
      provenance: baseProvenance,
      trace: baseTrace,
    });
    await changeSet.stage({
      entityIRI: middleIRI,
      typeIRI: `${BASE}Place`,
      document: { "@id": middleIRI, "@type": `${BASE}Place`, title: "Middle" },
      provenance: baseProvenance,
      trace: baseTrace,
      parentIRI: rootIRI,
    });
    await changeSet.stage({
      entityIRI: leafIRI,
      typeIRI: `${BASE}Location`,
      document: {
        "@id": leafIRI,
        "@type": `${BASE}Location`,
        title: "Leaf",
      },
      provenance: baseProvenance,
      trace: baseTrace,
      parentIRI: rootIRI,
      depth: 1,
    });

    changeSet.reparent(leafIRI, middleIRI);
    expect(changeSet.get(leafIRI)?.parentIRI).toBe(middleIRI);
    expect(changeSet.get(leafIRI)?.depth).toBe(2);
    expect(changeSet.get(middleIRI)?.depth).toBe(1);
    expect(changeSet.childrenOf(middleIRI).map((e) => e.entityIRI)).toEqual([
      leafIRI,
    ]);
  });
});

describe("document triples in staged dataset", () => {
  test("stores literal name triple for staged person", async () => {
    const changeSet = createStagedChangeSet({ propertyToIRI });
    const personIRI = `${BASE}person-1`;
    await changeSet.stage({
      entityIRI: personIRI,
      typeIRI: `${BASE}Person`,
      document: {
        "@id": personIRI,
        "@type": `${BASE}Person`,
        name: "Johann Wolfgang von Goethe",
      },
      provenance: baseProvenance,
      trace: baseTrace,
    });

    const namePredicate = namedNode(`${BASE}name`);
    const nameQuads = changeSet.dataset.getQuads(
      namedNode(personIRI),
      namePredicate,
      null,
      null,
    );
    expect(nameQuads.length).toBeGreaterThanOrEqual(1);
    expect(nameQuads[0]?.object.value).toBe("Johann Wolfgang von Goethe");
  });
});
