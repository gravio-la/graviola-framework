import {
  createStoreRestHandler,
  provenanceStampInterceptor,
} from "@graviola/rest-store-server";
import { createPrismaStorePair, TYPE_NAMES } from "./store";
import { createSessionRoutes } from "./sessions";
import { corsMiddleware, withCors } from "./corsMiddleware";

const PORT = Number(process.env.PORT ?? 4020);
const BASE_PATH = "/api/graviola";

const { store, abstractDatastore } = createPrismaStorePair();

const handler = createStoreRestHandler({
  store,
  typeNames: TYPE_NAMES,
  basePath: BASE_PATH,
  middleware: [corsMiddleware()],
  interceptors: [provenanceStampInterceptor({ source: "import-api" })],
  routes: createSessionRoutes(abstractDatastore, store),
});

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch: async (req) => {
    if (req.method === "OPTIONS") {
      return withCors(req, new Response(null, { status: 204 }));
    }
    const res = await handler(req);
    if (!res) {
      return withCors(req, new Response("Not Found", { status: 404 }));
    }
    return withCors(req, res);
  },
});

console.log(
  `import-api listening on http://localhost:${server.port}${BASE_PATH}`,
);
console.log(
  `Handshake: http://localhost:${server.port}/.well-known/graviola-store`,
);
