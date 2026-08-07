import { describe, expect, it } from "bun:test";
import { gardenFeeSchema, gardenFeeSidecar } from "@graviola/calc-fixtures";
import { schemaIdentityOfSync } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { compileCalcProfile } from "./compileCalcProfile";
import { planCalcReads } from "./planCalcReads";
import { createCalcProfileSidecar } from "./types";

describe("planCalcReads", () => {
  it("derives the exact garden-fee selection set from Garden", () => {
    const profile = compileCalcProfile(gardenFeeSidecar, gardenFeeSchema);
    const plan = planCalcReads(profile, "Garden", gardenFeeSchema);

    expect(plan.unreachable).toEqual([]);
    expect(plan.satisfiedSlots.sort()).toEqual(
      Object.keys(profile.slots).sort(),
    );
    expect(plan.depth).toBe(2);
    expect(plan.selection).toEqual({
      includeRelationsByDefault: false,
      select: {
        fee_rate_per_sqm: true,
        total_billable: true,
      },
      include: {
        patch: {
          select: {
            billable_area_total: true,
          },
          include: {
            plots: {
              select: {
                width_m: true,
                length_m: true,
                billable_area: true,
              },
            },
          },
        },
      },
    });
  });

  it("reports unreachable slots with no schema path from root", () => {
    const schema = {
      $id: "https://example.org/orphan/v1",
      version: "1.0.0",
      definitions: {
        A: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            x: { type: "number" },
            y: { type: "number", readOnly: true },
          },
        },
        Orphan: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            z: { type: "number" },
            w: { type: "number", readOnly: true },
          },
        },
      },
    } as JSONSchema7;

    const identity = schemaIdentityOfSync(schema);
    const sidecar = createCalcProfileSidecar(identity, {
      "#/definitions/A/properties/y": { formula: "x * 2" },
      "#/definitions/Orphan/properties/w": { formula: "z + 1" },
    });
    const profile = compileCalcProfile(sidecar, schema);
    const plan = planCalcReads(profile, "A", schema);

    expect(plan.satisfiedSlots).toContain("#/definitions/A/properties/y");
    expect(plan.unreachable.map((u) => u.scope)).toContain(
      "#/definitions/Orphan/properties/w",
    );
  });

  it("terminates on cyclic $ref schemas without looping", () => {
    const schema = {
      $id: "https://example.org/cycle/v1",
      version: "1.0.0",
      definitions: {
        Node: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            value: { type: "number" },
            next: { $ref: "#/definitions/Node" },
            doubled: { type: "number", readOnly: true },
          },
        },
      },
    } as JSONSchema7;

    const identity = schemaIdentityOfSync(schema);
    const sidecar = createCalcProfileSidecar(identity, {
      "#/definitions/Node/properties/doubled": { formula: "value * 2" },
    });
    const profile = compileCalcProfile(sidecar, schema);
    const plan = planCalcReads(profile, "Node", schema);

    expect(plan.satisfiedSlots).toEqual([
      "#/definitions/Node/properties/doubled",
    ]);
    expect(plan.selection.select).toEqual({ value: true });
    // No infinite include of next.next.next…
    expect(plan.selection.include).toBeUndefined();
  });
});
