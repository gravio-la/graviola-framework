/**
 * The optional parts under a required child are lifted into the one
 * `OPTIONAL { { … } UNION { … } }` block of their level (see
 * `materializeWhereParts`). These tests pin the shape of the query and show
 * that the constructed triples are the same as with the nested form, which is
 * kept below as `materializeNested`, on a small in-memory Oxigraph store.
 */

import { describe, test, expect } from "bun:test";
import { sparql, SparqlTemplateResult } from "@tpluscode/sparql-builder";
import { buildTraversalSchema } from "@graviola/edb-graph-traversal";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import {
  materializeWhereParts,
  traversalSchema2construct,
  type WherePart,
} from "./traversalSchema2construct";
import { buildSPARQLConstructQuery } from "./buildSPARQLConstructQuery";
// oxigraph is a dependency of sparql-db-impl; sparql-schema does not list it.
import { Store } from "../../../sparql-db-impl/node_modules/oxigraph";

const EX = "http://ex/";

const stationSchema: any = {
  definitions: {
    Station: {
      type: "object",
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        tracks: { type: "array", items: { $ref: "#/definitions/Track" } },
      },
    },
    Track: {
      type: "object",
      required: ["trackOf"],
      properties: {
        number: { type: "string" },
        length: { type: "number" },
        trackOf: { $ref: "#/definitions/Station" },
      },
    },
  },
};

const build = (maxRecursion?: number) => {
  const schema = bringDefinitionToTop(stationSchema, "Station");
  const traversal = buildTraversalSchema(schema, {});
  return traversalSchema2construct(`${EX}s1`, `${EX}Station`, traversal, {
    prefixMap: { "": EX },
    maxRecursion,
  });
};

const where = (r: ReturnType<typeof build>) =>
  r.wherePatterns.map((p) => p.toString()).join("\n");

describe("materializeWhereParts - lifting the optional parts of required children", () => {
  test("the required child comes first and its optional parts join the one block of the level", () => {
    const w = where(build(2));
    // spine: the relation and its required back-reference, no block in between
    expect(w).toMatch(
      /\{ \?subject :tracks \?tracks_\d+ \.\n\?tracks_\d+ :trackOf \?trackOf_\d+ \.\nOPTIONAL \{ \{/,
    );
    // one block for the root level, one for the tracks branch
    expect(w.match(/OPTIONAL/g)).toHaveLength(2);
    // the optional parts of the required child are branches of the tracks block
    const tracksBranch = w.slice(w.indexOf(":tracks ?tracks_"));
    for (const branch of ["number", "length", "name", "code"]) {
      expect(tracksBranch).toMatch(
        new RegExp(`:${branch} \\?${branch}_\\d+ \\. \\}`),
      );
    }
  });

  test("a level never emits two OPTIONAL blocks in one group", () => {
    // depth 3: blocks nest (one per level) but are never siblings
    const w = where(build(3));
    expect(w).not.toMatch(/\. \} \}\s*\n\s*OPTIONAL \{/);
  });

  test("a lifted branch restates the required path from the anchor of its level", () => {
    const w = where(build(2));
    // own branch: the anchor is its own subject
    expect(w).toMatch(/\{ \?tracks_\d+ :number \?number_\d+ \. \}/);
    // lifted branch: the path to the back-reference first
    expect(w).toMatch(
      /\{ \?tracks_\d+ :trackOf \?trackOf_\d+ \.\n\?trackOf_\d+ :name \?name_\d+ \. \}/,
    );
  });

  test("a required child of the root is lifted into the one block of the root", () => {
    const schema = bringDefinitionToTop(
      {
        definitions: {
          Statement: {
            type: "object",
            required: ["derivedFrom"],
            properties: {
              quote: { type: "string" },
              derivedFrom: { $ref: "#/definitions/Source" },
            },
          },
          Source: {
            type: "object",
            properties: {
              page: { type: "string" },
              heading: { type: "string" },
            },
          },
        },
      } as any,
      "Statement",
    );
    const traversal = buildTraversalSchema(schema, {});
    const r = traversalSchema2construct(
      `${EX}s1`,
      `${EX}Statement`,
      traversal,
      {
        prefixMap: { "": EX },
        maxRecursion: 1,
      },
    );
    const w = where(r);
    expect(w.match(/OPTIONAL/g)).toHaveLength(1);
    expect(w).toMatch(
      /\{ \?subject :derivedFrom \?derivedFrom_\d+ \.\n\?derivedFrom_\d+ :page/,
    );
    expect(w).toMatch(/\{ \?subject :quote \?quote_\d+ \. \}/);
  });

  test("a part with a LATERAL window keeps its optional descendants out of the outer block", () => {
    const withTracks = (paginated: boolean): WherePart[] => [
      {
        required: true,
        whereTemplates: [sparql`VALUES ?subject { <${EX}s1> }`],
      },
      opt([tp("subject", "name", "name")]),
      {
        required: true,
        paginated,
        whereTemplates: [tp("subject", "tracks", "track")],
        children: [
          opt([tp("track", "number", "number")]),
          {
            required: true,
            whereTemplates: [tp("track", "trackOf", "station")],
            children: [opt([tp("station", "name", "stationName")])],
          },
        ],
      },
    ];
    const count = (ps: WherePart[]) =>
      (
        materializeWhereParts(ps)
          .map(String)
          .join("\n")
          .match(/OPTIONAL/g) ?? []
      ).length;
    expect(count(withTracks(false))).toBe(1);
    expect(count(withTracks(true))).toBe(2);
  });

  test("a level with a sibling-bound filter keeps the row-wise chain", () => {
    const schema = bringDefinitionToTop(stationSchema, "Station");
    const filterOptions = { where: { name: { contains: "Ber" } } };
    const traversal = buildTraversalSchema(schema, filterOptions);
    const r = traversalSchema2construct(`${EX}s1`, `${EX}Station`, traversal, {
      prefixMap: { "": EX },
      filterOptions,
    });
    const w = where(r);
    // the filtered property is required and read by a FILTER: no UNION for the
    // top level, `code` and `tracks` stay separate OPTIONAL blocks
    expect(w).toMatch(/OPTIONAL \{ \?subject :code \?code_\d+ \. \}/);
    expect(w).toMatch(/OPTIONAL \{ \?subject :tracks \?tracks_\d+ \./);
  });

  test("an explicit maxRecursion of 0 is not replaced by the default", () => {
    const zero = build(0)
      .constructPatterns.map((p) => p.toString())
      .join("\n");
    const dflt = build(undefined)
      .constructPatterns.map((p) => p.toString())
      .join("\n");
    expect(zero).toContain(":tracks ?tracks_");
    expect(zero).not.toContain(":number");
    expect(dflt).toContain(":number");
  });
});

/** The previous materialization: per required child its own OPTIONAL block. */
function materializeNested(parts: WherePart[]): SparqlTemplateResult[] {
  const join = (ps: SparqlTemplateResult[]) =>
    ps.reduce((acc, p, i) => (i === 0 ? p : sparql`${acc}\n${p}`));
  const results: SparqlTemplateResult[] = [];
  const optionalBody = (part: WherePart) => [
    ...part.whereTemplates,
    ...(part.children?.length ? materializeNested(part.children) : []),
  ];
  const optionals = parts.filter((p) => !p.required);
  const union = optionals.length > 1;
  for (const part of parts) {
    if (part.required) {
      results.push(...part.whereTemplates);
      if (part.children?.length)
        results.push(...materializeNested(part.children));
    } else if (!union) {
      results.push(sparql`OPTIONAL { ${join(optionalBody(part))} }`);
    }
  }
  if (union) {
    const u = optionals
      .map((o) => sparql`{ ${join(optionalBody(o))} }`)
      .reduce((a, b) => sparql`${a}\nUNION\n${b}`);
    results.push(sparql`OPTIONAL { ${u} }`);
  }
  return results;
}

const tp = (s: string, p: string, o: string) =>
  sparql`?${s} <${EX}${p}> ?${o} .`;
const typeOf = (s: string, t: string) =>
  sparql`?${s} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?${t} .`;
const opt = (
  whereTemplates: SparqlTemplateResult[],
  children?: WherePart[],
): WherePart => ({ required: false, whereTemplates, children });

// The structure `createPropertyPatterns` produces for Station.tracks at depth 2.
// `trackOf` is a required single-valued back-reference of a track.
const tracksPart = (): WherePart =>
  opt(
    [tp("subject", "tracks", "track")],
    [
      opt([typeOf("track", "trackType")]),
      opt([tp("track", "number", "number")]),
      opt([tp("track", "length", "length")]),
      {
        required: true,
        whereTemplates: [tp("track", "trackOf", "station")],
        children: [
          opt([typeOf("station", "stationType")]),
          opt([tp("station", "name", "stationName")]),
          opt([tp("station", "code", "stationCode")]),
          opt([tp("station", "tracks", "otherTrack")]),
        ],
      },
    ],
  );

const parts = (tracks: WherePart = tracksPart()): WherePart[] => [
  { required: true, whereTemplates: [sparql`VALUES ?subject { <${EX}s1> }`] },
  opt([typeOf("subject", "type")]),
  opt([tp("subject", "name", "name")]),
  opt([tp("subject", "code", "code")]),
  tracks,
];

const template = [
  "?subject a ?type",
  "?subject <" + EX + "name> ?name",
  "?subject <" + EX + "code> ?code",
  "?subject <" + EX + "tracks> ?track",
  "?track a ?trackType",
  "?track <" + EX + "number> ?number",
  "?track <" + EX + "length> ?length",
  "?track <" + EX + "trackOf> ?station",
  "?station a ?stationType",
  "?station <" + EX + "name> ?stationName",
  "?station <" + EX + "code> ?stationCode",
  "?station <" + EX + "tracks> ?otherTrack",
]
  .map((t) => `${t} .`)
  .join("\n");

const data = (n: number) => {
  const lines = [
    `<${EX}s1> a <${EX}Station> ; <${EX}name> "Alpha" ; <${EX}code> "AA" .`,
    `<${EX}s2> a <${EX}Station> ; <${EX}name> "Beta" .`,
    `<${EX}s3> a <${EX}Station> ; <${EX}name> "Gamma" ; <${EX}tracks> <${EX}t99> .`,
    `<${EX}t99> a <${EX}Track> ; <${EX}number> "9" ; <${EX}trackOf> <${EX}s3> .`,
  ];
  for (let i = 0; i < n; i++) {
    lines.push(
      `<${EX}s1> <${EX}tracks> <${EX}t${i}> .`,
      `<${EX}t${i}> a <${EX}Track> ; <${EX}number> "${i}" ; <${EX}length> ${i}.5 ; <${EX}trackOf> <${EX}s1> .`,
    );
  }
  return lines.join("\n");
};

const store = () => {
  const s = new Store();
  s.load(data(6), { format: "text/turtle" });
  return s;
};

const run = (s: InstanceType<typeof Store>, root: string, w: string) => {
  const body = w.replace(`<${EX}s1>`, `<${EX}${root}>`);
  const triples = (
    s.query(`CONSTRUCT { ${template} } WHERE { ${body} }`) as any[]
  )
    .map((q) => `${q.subject.value} ${q.predicate.value} ${q.object.value}`)
    .sort();
  const solutions = (s.query(`SELECT * WHERE { ${body} }`) as any[]).length;
  return { triples, solutions };
};

describe("materializeWhereParts - same triples as the nested form", () => {
  const nested = materializeNested(parts()).map(String).join("\n");
  const lifted = materializeWhereParts(parts()).map(String).join("\n");

  test("the two forms differ", () => {
    expect(lifted).not.toEqual(nested);
    // the nested form has a block directly after another block, the lifted one not
    expect(nested).toMatch(/\. \} \}\s*\n\s*OPTIONAL \{/);
    expect(lifted).not.toMatch(/\. \} \}\s*\n\s*OPTIONAL \{/);
    expect((nested.match(/OPTIONAL/g) ?? []).length).toBeGreaterThan(
      (lifted.match(/OPTIONAL/g) ?? []).length,
    );
  });

  for (const root of ["s1", "s2", "s3"]) {
    test(`construct result of ${root} is identical`, () => {
      const s = store();
      const a = run(s, root, nested);
      const b = run(s, root, lifted);
      expect(b.triples.length).toBeGreaterThan(0);
      expect(b.triples).toEqual(a.triples);
    });
  }

  test("the lifted form has the sum, not the product, of the solutions", () => {
    const s = store();
    const a = run(s, "s1", nested);
    const b = run(s, "s1", lifted);
    expect(b.solutions).toBeLessThan(a.solutions);
    // 6 tracks: nested form multiplies the block under trackOf with the one of the level
    expect(a.solutions).toBeGreaterThan(b.solutions * 2);
  });
});
