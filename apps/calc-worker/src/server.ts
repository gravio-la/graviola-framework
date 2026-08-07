import { createStoreRestHandler } from "@graviola/rest-store-server";
import { createCalcWorker, type CalcWorkerStore } from "@graviola/calc-worker";
import {
  createGardenFeeStore,
  gardenFeeCalcProfile,
  gardenFeeSchema,
  TYPE_NAMES,
} from "./store";

const PORT = Number(process.env.PORT ?? 4030);
const BASE_PATH = "/api/graviola";

const { store, dispose } = await createGardenFeeStore();

// `store.subscribe`/`writeStatements`/`loadStatements`/`filterMany` are all
// guaranteed present by `createGardenFeeStore`'s `statementMeta` config
// (every store-factory backend implements the change bus unconditionally,
// and `statementMeta` turns on the statements facet).
const calcWorker = await createCalcWorker({
  store: store as unknown as CalcWorkerStore,
  profile: gardenFeeCalcProfile,
  domainSchema: gardenFeeSchema,
  rootTypeName: "Garden",
  agent: "https://graviola.dev/agents/calc-worker",
});

const handler = createStoreRestHandler({
  store,
  typeNames: TYPE_NAMES,
  basePath: BASE_PATH,
});

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch: async (req) => {
    const res = await handler(req);
    return res ?? new Response("Not Found", { status: 404 });
  },
});

console.log(
  `calc-worker listening on http://localhost:${server.port}${BASE_PATH}`,
);
console.log(
  `Handshake: http://localhost:${server.port}/.well-known/graviola-store`,
);

const shutdown = async (): Promise<void> => {
  calcWorker.stop();
  await dispose?.();
  server.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
