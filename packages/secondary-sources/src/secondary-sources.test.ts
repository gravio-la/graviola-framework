import { describe, expect, test, beforeEach } from "bun:test";
import { Hono } from "hono";
import { stringify as stringifyYaml } from "yaml";

import { clearAuthTokenCache } from "./auth";
import { normalizeCandidates } from "./normalize";
import { parseDeclarationYaml, parseMappingYaml } from "./parseYaml";
import { createSecondarySourceRuntime, mergeSearchOverride } from "./runtime";
import { wikidataSourceTemplate } from "./templates";
import type { SecondaryDataSourceDeclaration } from "./types";

function createPreLoginStubApp() {
  const tokens = new Set<string>();
  const rate = { count: 0 };
  const items = [
    { id: "ex-001", type: "Exhibition", title: "Modern Masters 2024" },
    { id: "p-001", type: "Person", name: "Pablo Picasso" },
  ];
  const app = new Hono();
  app.post("/login", async (c) => {
    const token = `stub-token-${Date.now()}`;
    tokens.add(token);
    return c.json({ token, expiresIn: 3600 });
  });
  app.get("/items", (c) => {
    const token = (c.req.header("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!tokens.has(token)) return c.json({ error: "unauthorized" }, 401);
    rate.count++;
    if (rate.count > 10) return c.json({ error: "rate_limit_exceeded" }, 429);
    const q = (c.req.query("q") ?? "").toLowerCase();
    const type = c.req.query("type") ?? "";
    const filtered = items.filter(
      (i) =>
        (!type || i.type === type) &&
        (!q || JSON.stringify(i).toLowerCase().includes(q)),
    );
    return c.json({ items: filtered });
  });
  return app;
}

function preLoginDeclaration(baseUrl: string): SecondaryDataSourceDeclaration {
  return {
    id: "stub-auth-db",
    label: "Stub pre-login source",
    authorityIRI: "http://example.org/stub-auth-db",
    enabled: true,
    kind: "declarative",
    auth: {
      mode: "pre-login",
      login: {
        id: "stub-login",
        kind: "rest",
        method: "POST",
        url: `${baseUrl}/login`,
        headers: { "Content-Type": "application/json" },
        body: { kind: "const", value: "{}" },
      },
      tokenPath: "token",
      ttlSeconds: 3600,
      inject: { header: "Authorization", template: "Bearer {{token}}" },
    },
    operations: {
      search: {
        id: "stub-search",
        kind: "rest",
        method: "GET",
        cache: { disabled: true },
        url: `${baseUrl}/items`,
        query: {
          q: { kind: "path", from: "input", path: "q", required: true },
          type: { kind: "path", from: "input", path: "type" },
        },
        itemsPath: "items",
        labelPath: "title",
        idPath: "id",
      },
      searchByType: {
        Exhibition: {
          id: "stub-search-exhibition",
          kind: "rest",
          method: "GET",
          cache: { disabled: true },
          url: `${baseUrl}/items`,
          query: {
            q: { kind: "path", from: "input", path: "q", required: true },
            type: { kind: "const", value: "Exhibition" },
          },
          itemsPath: "items",
          labelPath: "title",
          idPath: "id",
        },
      },
      getEntity: {
        id: "stub-entity",
        kind: "rest",
        method: "GET",
        url: `${baseUrl}/items/{{id}}`,
        params: {
          id: { kind: "path", from: "input", path: "id", required: true },
        },
      },
    },
    examples: [
      {
        id: "stub-login-search",
        label: "Login + search exhibitions",
        operation: "search",
        input: { q: "Modern", targetType: "Exhibition" },
        expect: { minItems: 1, containsId: "ex-001" },
      },
    ],
  };
}

describe("parseDeclarationYaml", () => {
  test("accepts valid minimal declaration", () => {
    const result = parseDeclarationYaml(
      stringifyYaml(wikidataSourceTemplate()),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe("wikidata");
  });

  test("rejects invalid YAML", () => {
    const result = parseDeclarationYaml("id: [\n  broken");
    expect(result.ok).toBe(false);
  });
});

describe("parseMappingYaml", () => {
  test("accepts valid mapping array", () => {
    const yaml = stringifyYaml([
      { source: { path: "$.name" }, target: { path: "name" } },
    ]);
    const result = parseMappingYaml(yaml);
    expect(result.ok).toBe(true);
  });
});

describe("normalizeCandidates", () => {
  test("maps reconcile-style results", () => {
    const items = [
      { id: "Q5593", name: "Pablo Picasso", description: "painter" },
    ];
    const candidates = normalizeCandidates(
      items,
      { idPath: "id", labelPath: "name", descriptionPath: "description" },
      "http://www.wikidata.org",
      "http://www.wikidata.org/entity/{{id}}",
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.iri).toBe("http://www.wikidata.org/entity/Q5593");
    expect(candidates[0]!.label).toBe("Pablo Picasso");
  });
});

describe("searchByType partial override", () => {
  test("mergeSearchOverride inherits base fields and merges query keys", () => {
    const base: SecondaryDataSourceDeclaration["operations"]["search"] = {
      id: "base-search",
      kind: "rest",
      method: "GET",
      url: "http://example.org/people",
      query: {
        name: { kind: "path", from: "input", path: "q", required: true },
        size: { kind: "path", from: "input", path: "limit", default: 10 },
      },
      itemsPath: "data",
      labelPath: "label",
      idPath: "api_url",
    };

    const merged = mergeSearchOverride(
      base,
      {
        url: "http://example.org/exhibitions",
        query: {
          title: { kind: "path", from: "input", path: "q", required: true },
        },
      },
      "Exhibition",
    );

    expect(merged.id).toBe("base-search:Exhibition");
    expect(merged.url).toBe("http://example.org/exhibitions");
    expect(merged.itemsPath).toBe("data");
    expect(merged.labelPath).toBe("label");
    expect(merged.idPath).toBe("api_url");
    expect(merged.method).toBe("GET");
    expect(merged.query).toEqual({
      name: { kind: "path", from: "input", path: "q", required: true },
      size: { kind: "path", from: "input", path: "limit", default: 10 },
      title: { kind: "path", from: "input", path: "q", required: true },
    });
  });

  test("runtime search uses merged searchByType override", async () => {
    const app = new Hono();
    app.get("/people", (c) => {
      const name = c.req.query("name") ?? "";
      return c.json({
        data: [
          { api_url: "http://example.org/people/p1", label: name || "Alice" },
        ],
      });
    });
    app.get("/exhibitions", (c) => {
      const title = c.req.query("title") ?? "";
      return c.json({
        data: [
          {
            api_url: "http://example.org/exhibitions/e1",
            label: title || "Modern Art",
          },
        ],
      });
    });

    const server = Bun.serve({ port: 0, fetch: app.fetch });
    const baseUrl = `http://localhost:${server.port}`;

    try {
      const declaration: SecondaryDataSourceDeclaration = {
        id: "partial-override-stub",
        label: "Partial override stub",
        authorityIRI: "http://example.org/stub",
        enabled: true,
        kind: "declarative",
        operations: {
          search: {
            id: "base-search",
            kind: "rest",
            method: "GET",
            cache: { disabled: true },
            url: `${baseUrl}/people`,
            query: {
              name: { kind: "path", from: "input", path: "q", required: true },
            },
            itemsPath: "data",
            labelPath: "label",
            idPath: "api_url",
          },
          searchByType: {
            Exhibition: {
              url: `${baseUrl}/exhibitions`,
              query: {
                title: {
                  kind: "path",
                  from: "input",
                  path: "q",
                  required: true,
                },
              },
            },
          },
          getEntity: {
            id: "stub-entity",
            kind: "rest",
            method: "GET",
            url: `${baseUrl}/people/{{id}}`,
            params: {
              id: { kind: "path", from: "input", path: "id", required: true },
            },
          },
        },
        examples: [],
      };

      const runtime = createSecondarySourceRuntime(declaration);

      const person = await runtime.search("Alice");
      expect(person.candidates).toHaveLength(1);
      expect(person.candidates[0]!.label).toBe("Alice");
      expect(person.provenance?.sourceId).toBe("base-search");

      const exhibition = await runtime.search("Modern", {
        targetType: "Exhibition",
      });
      expect(exhibition.candidates).toHaveLength(1);
      expect(exhibition.candidates[0]!.id).toBe(
        "http://example.org/exhibitions/e1",
      );
      expect(exhibition.provenance?.sourceId).toBe("base-search:Exhibition");
    } finally {
      server.stop();
    }
  });
});

describe("pre-login runtime", () => {
  beforeEach(() => {
    clearAuthTokenCache();
  });

  test("search after pre-login returns items", async () => {
    const app = createPreLoginStubApp();
    const server = Bun.serve({ port: 0, fetch: app.fetch });
    const baseUrl = `http://localhost:${server.port}`;

    try {
      const runtime = createSecondarySourceRuntime(
        preLoginDeclaration(baseUrl),
      );
      const { candidates } = await runtime.search("Modern", {
        targetType: "Exhibition",
      });
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0]!.id).toBe("ex-001");
    } finally {
      server.stop();
    }
  });

  test("rate limit returns 429 after threshold", async () => {
    const app = createPreLoginStubApp();
    const server = Bun.serve({ port: 0, fetch: app.fetch });
    const baseUrl = `http://localhost:${server.port}`;

    try {
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const { token } = (await loginRes.json()) as { token: string };
      const headers = { Authorization: `Bearer ${token}` };

      let got429 = false;
      for (let i = 0; i < 15; i++) {
        const res = await fetch(`${baseUrl}/items?q=test`, { headers });
        if (res.status === 429) {
          got429 = true;
          break;
        }
      }
      expect(got429).toBe(true);
    } finally {
      server.stop();
    }
  });

  test("runExample passes for pre-login search", async () => {
    const app = createPreLoginStubApp();
    const server = Bun.serve({ port: 0, fetch: app.fetch });
    const baseUrl = `http://localhost:${server.port}`;

    try {
      const runtime = createSecondarySourceRuntime(
        preLoginDeclaration(baseUrl),
      );
      const result = await runtime.runExample("stub-login-search");
      expect(result.ok).toBe(true);
    } finally {
      server.stop();
    }
  });
});
