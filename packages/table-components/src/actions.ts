import type { TableActionRegistryEntry } from "./types";

export const createMoveToTrashRowEntry = (
  run: (entityIRI: string) => Promise<void> | void,
): TableActionRegistryEntry => ({
  surface: "row",
  name: "graviola.moveToTrash",
  tester: () => 5,
  build: () => ({
    id: "moveToTrashRow",
    label: "Move to trash",
    destructive: true,
    run: async (entities) => {
      const first = entities[0];
      if (first?.entityIRI) {
        await run(first.entityIRI);
      }
    },
  }),
});

export const createMoveToTrashBulkEntry = (
  run: (entityIRIs: string[]) => Promise<void> | void,
): TableActionRegistryEntry => ({
  surface: "bulk",
  name: "graviola.moveToTrash",
  tester: () => 5,
  build: () => ({
    id: "moveToTrashBulk",
    label: "Move selected to trash",
    destructive: true,
    run: async (entities) => {
      await run(entities.map((entry) => entry.entityIRI));
    },
  }),
});

export const createDeleteRowEntry = (
  run: (entityIRI: string) => Promise<void> | void,
): TableActionRegistryEntry => ({
  surface: "row",
  name: "graviola.delete",
  tester: () => 4,
  build: () => ({
    id: "deleteRow",
    label: "Delete permanently",
    destructive: true,
    run: async (entities) => {
      const first = entities[0];
      if (first?.entityIRI) {
        await run(first.entityIRI);
      }
    },
  }),
});

export const createDeleteBulkEntry = (
  run: (entityIRIs: string[]) => Promise<void> | void,
): TableActionRegistryEntry => ({
  surface: "bulk",
  name: "graviola.delete",
  tester: () => 4,
  build: () => ({
    id: "deleteBulk",
    label: "Delete selected permanently",
    destructive: true,
    run: async (entities) => {
      await run(entities.map((entry) => entry.entityIRI));
    },
  }),
});
