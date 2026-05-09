/**
 * Generates OpenAPI **3.1** from the canonical v1 markdown spec intent (static template).
 * Source of truth remains `spec/graviola-rest-wire-v1.md`; regenerate after contract edits.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Graviola REST Store wire API (v1)",
    version: "1.0.0",
    description:
      "Generated artifact — normative prose lives in spec/graviola-rest-wire-v1.md and spec/graviola-rest-handshake.md.",
  },
  paths: {
    "/.well-known/graviola-store": {
      get: {
        summary: "Graviola Store handshake",
        responses: {
          "200": {
            description: "Handshake descriptor",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GraviolaHandshakeResponse",
                },
              },
            },
          },
        },
      },
    },
    "/{typeName}": {
      get: {
        summary: "List entities of a type",
        parameters: [
          { $ref: "#/components/parameters/TypeName" },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated items",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListEnvelope" },
              },
            },
          },
        },
      },
    },
    "/{typeName}/{id}": {
      get: {
        summary: "Load one entity",
        parameters: [
          { $ref: "#/components/parameters/TypeName" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Entity JSON-LD document",
            content: {
              "application/json": { schema: { type: "object" } },
              "application/vnd.graviola-store.envelope+json": {
                schema: { $ref: "#/components/schemas/ReadResultEnvelope" },
              },
            },
          },
          "404": { $ref: "#/components/responses/Problem" },
        },
      },
      head: {
        summary: "Exists probe",
        parameters: [
          { $ref: "#/components/parameters/TypeName" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Present" },
          "404": { description: "Absent" },
        },
      },
      put: {
        summary: "Upsert entity",
        parameters: [
          { $ref: "#/components/parameters/TypeName" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object" } },
          },
        },
        responses: {
          "200": { description: "Upserted entity" },
          "409": { $ref: "#/components/responses/Problem" },
        },
      },
      delete: {
        summary: "Remove entity",
        parameters: [
          { $ref: "#/components/parameters/TypeName" },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Removed" },
          "404": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/{typeName}/_query": {
      post: {
        summary: "Typed filter query",
        parameters: [{ $ref: "#/components/parameters/TypeName" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QueryBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListEnvelope" },
              },
            },
          },
        },
      },
    },
    "/{typeName}/_count": {
      post: {
        summary: "Count matches",
        parameters: [{ $ref: "#/components/parameters/TypeName" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CountBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { type: "integer" },
                    { $ref: "#/components/schemas/CountEnvelope" },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/{typeName}/_search": {
      post: {
        summary: "Text search",
        parameters: [{ $ref: "#/components/parameters/TypeName" }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SearchBody" },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ListEnvelope" },
              },
            },
          },
        },
      },
    },
    "/_resolve-types": {
      get: {
        summary: "Resolve RDF classes for entity IRI (optional)",
        parameters: [
          {
            name: "entityIRI",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      TypeName: {
        name: "typeName",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    },
    responses: {
      Problem: {
        description: "RFC7807-style problem",
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/ProblemDetails" },
          },
        },
      },
    },
    schemas: {
      ProblemDetails: {
        type: "object",
        required: ["status", "code"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          status: { type: "integer" },
          code: { type: "string" },
          detail: { type: "string" },
          instance: { type: "string" },
        },
      },
      GraviolaHandshakeResponse: {
        type: "object",
        properties: {
          graviolaStore: { type: "object" },
        },
        required: ["graviolaStore"],
      },
      ListEnvelope: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object" } },
          pagination: { type: "object" },
        },
      },
      ReadResultEnvelope: {
        type: "object",
        properties: {
          data: { type: "object" },
          provenance: { type: "object" },
          completeness: { type: "object" },
          cost: { type: "object" },
        },
        required: ["data", "provenance"],
      },
      QueryBody: {
        type: "object",
        properties: {
          where: { type: "object" },
          include: { type: "object" },
          select: { type: "object" },
          omit: { type: "object" },
          pagination: { type: "object" },
          searchString: { type: ["string", "null"] },
        },
      },
      CountBody: {
        type: "object",
        properties: {
          where: { type: "object" },
          searchString: { type: "string" },
          insensitive: { type: "boolean" },
        },
      },
      CountEnvelope: {
        type: "object",
        properties: { count: { type: "integer" } },
        required: ["count"],
      },
      SearchBody: {
        type: "object",
        properties: {
          text: { type: "string" },
          fields: { type: "array", items: { type: "string" } },
          restrictTo: { type: "object" },
          limit: { type: "integer" },
          mode: { type: "string" },
        },
        required: ["text"],
      },
    },
  },
} as const;

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "openapi",
);
const outFile = path.join(outDir, "graviola-rest-v1.openapi.json");

await mkdir(outDir, { recursive: true });
await writeFile(outFile, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${outFile}`);
