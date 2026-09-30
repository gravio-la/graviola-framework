import type { EntityActionEntry } from "@graviola/edb-detail-renderer-core";

export const createDeleteRowEntry = (
  run: (entityIRI: string) => Promise<void> | void,
): EntityActionEntry => ({
  name: "graviola.delete",
  surfaces: ["tableRow"],
  tester: () => 4,
  build: () => ({
    id: "deleteRow",
    label: "Delete permanently",
    intent: "custom",
    destructive: true,
    run: async (targets) => {
      const first = targets[0];
      if (first?.entityIRI) await run(first.entityIRI);
    },
  }),
});

export const createDeleteBulkEntry = (
  run: (entityIRIs: string[]) => Promise<void> | void,
): EntityActionEntry => ({
  name: "graviola.delete",
  surfaces: ["tableBulk"],
  tester: () => 4,
  build: () => ({
    id: "deleteBulk",
    label: "Delete selected permanently",
    intent: "custom",
    destructive: true,
    run: async (targets) => {
      await run(
        targets
          .map((entry) => entry.entityIRI)
          .filter((id): id is string => Boolean(id)),
      );
    },
  }),
});
