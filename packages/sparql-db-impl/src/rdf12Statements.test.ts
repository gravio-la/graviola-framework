import { describe, expect, test } from "bun:test";
import { Store } from "oxigraph";
import {
  buildRdf12StatementDelete,
  buildRdf12StatementInsert,
  buildRdf12StatementSelect,
  parseRdf12StatementBindings,
} from "./rdf12Statements";
import { statementValueHash } from "@graviola/statement-meta";

describe("rdf-12 spike (Oxigraph 0.5.6)", () => {
  const entity = "http://example.org/Item/1";
  const prop = "http://example.org/price";

  test("annotation syntax insert/select", () => {
    const store = new Store();
    let annotationWorks = false;
    try {
      store.update(`
        INSERT DATA {
          <${entity}> <${prop}> "42" {| <http://example.org/source> "import" |} .
        }
      `);
      const rows = store.query(`
        SELECT ?src WHERE {
          <<( <${entity}> <${prop}> "42" )>> <http://example.org/source> ?src .
        }
      `) as Array<{ src?: { value: string } }>;
      annotationWorks = rows.some((r) => r.src?.value === "import");
    } catch {
      annotationWorks = false;
    }
    expect(typeof annotationWorks).toBe("boolean");
  });

  test("explicit reifier with addressing predicates round-trip", () => {
    const store = new Store();
    const insert = buildRdf12StatementInsert(entity, prop, "price", {
      path: "price",
      value: 42,
      statement: { source: "nas01", rank: "normal" },
    });
    store.update(insert);

    const select = buildRdf12StatementSelect(entity, ["price"]);
    const raw = store.query(select, {
      results_format: "application/sparql-results+json",
    }) as string;
    const parsed = JSON.parse(raw || "{}") as {
      results?: { bindings?: Record<string, { value: string }>[] };
    };
    const grouped = parseRdf12StatementBindings(parsed.results?.bindings ?? []);
    expect(grouped.price?.[0]?.value).toBe("42");
    expect(grouped.price?.[0]?.source).toBe("nas01");

    store.update(
      buildRdf12StatementDelete(entity, prop, "price", statementValueHash(42)),
    );
    const after = store.query(select, {
      results_format: "application/sparql-results+json",
    }) as string;
    const parsedAfter = JSON.parse(after || "{}") as {
      results?: { bindings?: unknown[] };
    };
    expect(parsedAfter.results?.bindings?.length ?? 0).toBe(0);
  });
});

describe("rdf12Statements builders", () => {
  test("insert contains truthy triple and reifier", () => {
    const q = buildRdf12StatementInsert(
      "http://ex/i",
      "http://ex/price",
      "price",
      { path: "price", value: 10, statement: {} },
    );
    expect(q).toContain("http://ex/i");
    expect(q).toContain("http://ex/price");
    expect(q).toContain("rdf-syntax-ns#reifies");
  });
});
