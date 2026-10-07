/**
 * Query injection through save(): every case stores a hostile document and
 * runs the generated update against a real Oxigraph store. A bystander triple
 * that the document never mentions must survive — either because the value is
 * serialized safely or because save() refuses it.
 */

import { describe, expect, test } from "bun:test";
import { Store } from "oxigraph";
import { JSONSchema7 } from "json-schema";

// Source import: the injection surface is save() itself, not the built package.
import { save } from "../../sparql-schema/src/crud/save";

const schema: JSONSchema7 = {
  type: "object",
  properties: { p: { type: "string" } },
};

const BYSTANDER = `<urn:bystander> <urn:keep> "untouched"`;

// Closes the INSERT DATA block, wipes the store, and reopens a block so the
// rest of the serialized data still parses. Needs no whitespace.
const WIPE = "};DELETE{?s?p?o}WHERE{?s?p?o};INSERT{}WHERE{";

const hostileDocuments: Record<string, Record<string, unknown>> = {
  "literal value": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    "urn:p": `x" . ${WIPE} <urn:a> <urn:b> "y`,
  },
  "object IRI": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    "urn:p": { "@id": `urn:x>${WIPE}<urn:a><urn:b><urn:c` },
  },
  "predicate IRI": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    [`urn:p><urn:o>${WIPE}<urn:a><urn:b`]: "v",
  },
  "datatype IRI": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    "urn:p": { "@value": "v", "@type": `urn:dt>${WIPE}<urn:a><urn:b><urn:c` },
  },
  "language tag": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    "urn:p": { "@value": "v", "@language": `en${WIPE}<urn:a><urn:b>"x"@en` },
  },
  "type IRI": {
    "@id": "urn:e:1",
    "@type": `urn:T>${WIPE}<urn:a><urn:b><urn:c`,
  },
  "subject IRI": {
    "@id": `urn:e:1><urn:p><urn:o>${WIPE}<urn:a`,
    "@type": "urn:T",
  },
  "blank node label": {
    "@id": "urn:e:1",
    "@type": "urn:T",
    "urn:p": { "@id": `_:b${WIPE}<urn:a><urn:b>_:c` },
  },
};

const bystanderSurvives = (store: Store) =>
  store.query(`ASK { ${BYSTANDER} }`) as boolean;

describe("save - query injection", () => {
  for (const skipRemove of [true, false]) {
    describe(
      skipRemove ? "insert only (skipRemove)" : "delete + insert",
      () => {
        for (const [position, doc] of Object.entries(hostileDocuments)) {
          test(`hostile ${position} cannot touch other data`, async () => {
            const store = new Store();
            store.update(`INSERT DATA { ${BYSTANDER} }`);

            try {
              await save(
                doc as any,
                schema,
                async (query) => store.update(query),
                { skipRemove, defaultPrefix: "urn:", queryBuildOptions: {} },
              );
            } catch {
              // refusing the document is a safe outcome
            }

            expect(bystanderSurvives(store)).toBe(true);
          });
        }
      },
    );
  }

  // IRIs of well-known namespaces must not be abbreviated to prefixed names:
  // characters that are legal in an IRI end a prefixed name early.
  const prefixedNameDocuments: Record<string, Record<string, unknown>> = {
    "object IRI": {
      "@id": "urn:e:1",
      "@type": "urn:T",
      "urn:p": { "@id": "http://schema.org/o;schema:role'admin'" },
    },
    "datatype IRI": {
      "@id": "urn:e:1",
      "@type": "urn:T",
      "urn:p": {
        "@value": "v",
        "@type": "http://schema.org/dt;schema:role'admin'",
      },
    },
    "predicate IRI": {
      "@id": "urn:e:1",
      "@type": "urn:T",
      "http://schema.org/p'x';schema:role": "admin",
    },
  };

  for (const skipRemove of [true, false]) {
    for (const [position, doc] of Object.entries(prefixedNameDocuments)) {
      test(`${position} in a well-known namespace stays one term (skipRemove=${skipRemove})`, async () => {
        const store = new Store();

        try {
          await save(doc as any, schema, async (query) => store.update(query), {
            skipRemove,
            defaultPrefix: "urn:",
            queryBuildOptions: {},
          });
        } catch {
          // refusing the document is a safe outcome
        }

        expect(
          store.query(`ASK { ?s <http://schema.org/role> ?o }`) as boolean,
        ).toBe(false);
      });
    }
  }

  test("a remote @context is refused and never fetched", async () => {
    let requests = 0;
    const server = Bun.serve({
      port: 0,
      hostname: "127.0.0.1",
      fetch() {
        requests++;
        return Response.json({ "@context": { name: "urn:name" } });
      },
    });
    const store = new Store();

    try {
      await expect(
        save(
          {
            "@context": `http://127.0.0.1:${server.port}/context`,
            "@id": "urn:e:1",
            "@type": "urn:T",
            name: "x",
          } as any,
          schema,
          async (query) => store.update(query),
          { skipRemove: true, defaultPrefix: "urn:", queryBuildOptions: {} },
        ),
      ).rejects.toThrow();
    } finally {
      server.stop(true);
    }

    expect(requests).toBe(0);
    expect(store.size).toBe(0);
  });

  test("a nested remote @context is refused and never fetched", async () => {
    let requests = 0;
    const server = Bun.serve({
      port: 0,
      hostname: "127.0.0.1",
      fetch() {
        requests++;
        return Response.json({ "@context": { name: "urn:name" } });
      },
    });
    const store = new Store();

    try {
      await expect(
        save(
          {
            "@id": "urn:e:1",
            "@type": "urn:T",
            "urn:p": {
              "@context": `http://127.0.0.1:${server.port}/context`,
              name: "x",
            },
          } as any,
          schema,
          async (query) => store.update(query),
          { skipRemove: true, defaultPrefix: "urn:", queryBuildOptions: {} },
        ),
      ).rejects.toThrow();
    } finally {
      server.stop(true);
    }

    expect(requests).toBe(0);
    expect(store.size).toBe(0);
  });

  for (const defaultUpdateGraph of [undefined, "urn:graph:mine"]) {
    test(`a document with @graph is refused before any update is sent (graph=${defaultUpdateGraph})`, async () => {
      const sent: string[] = [];

      await expect(
        save(
          {
            "@id": "urn:graph:foreign",
            "@graph": [{ "@id": "urn:victim", "urn:p": "x" }],
          } as any,
          schema,
          async (query) => {
            sent.push(query);
          },
          {
            skipRemove: true,
            defaultPrefix: "urn:",
            defaultUpdateGraph,
            queryBuildOptions: {},
          },
        ),
      ).rejects.toThrow(/named graph/);

      expect(sent).toEqual([]);
    });
  }

  test("a hostile literal is stored verbatim", async () => {
    const store = new Store();
    const value = hostileDocuments["literal value"]["urn:p"] as string;

    await save(
      hostileDocuments["literal value"] as any,
      schema,
      async (query) => store.update(query),
      { skipRemove: true, defaultPrefix: "urn:", queryBuildOptions: {} },
    );

    const rows = store.query(
      `SELECT ?o WHERE { <urn:e:1> <urn:p> ?o }`,
    ) as Array<Map<string, { value: string }>>;
    expect(rows.map((r) => r.get("o")?.value)).toEqual([value]);
  });

  test("literal text containing the blank-node marker is stored verbatim", async () => {
    const store = new Store();
    const value = "text with _:_: inside";

    await save(
      { "@id": "urn:e:1", "@type": "urn:T", "urn:p": value } as any,
      schema,
      async (query) => store.update(query),
      { skipRemove: true, defaultPrefix: "urn:", queryBuildOptions: {} },
    );

    const rows = store.query(
      `SELECT ?o WHERE { <urn:e:1> <urn:p> ?o }`,
    ) as Array<Map<string, { value: string }>>;
    expect(rows.map((r) => r.get("o")?.value)).toEqual([value]);
  });
});
