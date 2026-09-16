import type { EntityActionEntry } from "@graviola/edb-detail-renderer-core";

export const createMoveToTrashRowEntry = (
  run: (entityIRI: string) => Promise<void> | void,
): EntityActionEntry => ({
  name: "graviola.moveToTrash",
  surfaces: ["tableRow"],
  tester: () => 5,
  build: (ctx) => ({
    id: "moveToTrashRow",
    label: "Move to trash",
    intent: "custom",
    destructive: true,
    run: async (targets) => {
      const first = targets[0];
      if (first?.entityIRI) await run(first.entityIRI);
    },
  }),
});

export const createMoveToTrashBulkEntry = (
  run: (entityIRIs: string[]) => Promise<void> | void,
): EntityActionEntry => ({
  name: "graviola.moveToTrash",
  surfaces: ["tableBulk"],
  tester: () => 5,
  build: () => ({
    id: "moveToTrashBulk",
    label: "Move selected to trash",
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
