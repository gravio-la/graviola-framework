/**
 * Follow-up LATERAL shapes: optional-inside-RHS and leaf parents.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "oxigraph";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ttl = readFileSync(
  join(__dirname, "../../sample-data/domains/geo/out/geo.ttl"),
  "utf8",
);
const VOCAB = "http://ontologies.gra.one/samples/geo#";
const PARENT = "http://ontologies.gra.one/samples/geo/Place/Q6317";
const LONELY = "http://ontologies.gra.one/samples/geo/City/Q10719651";

const store = new Store();
store.load(ttl, {
  format: "text/turtle",
  base_iri: "http://ontologies.gra.one/samples/geo/",
});

function run(label, query) {
  console.log(`\n=== ${label} ===`);
  try {
    const raw = store.query(query, {
      results_format: "application/sparql-results+json",
    });
    const rows = JSON.parse(raw).results.bindings.map((b) =>
      Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])),
    );
    console.log(`rows: ${rows.length}`);
    for (const r of rows.slice(0, 12)) console.log(JSON.stringify(r));
    return rows;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    return null;
  }
}

run(
  "OPTIONAL inside LATERAL RHS — parent with kids",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  LATERAL {
    SELECT ?subject ?child WHERE {
      OPTIONAL {
        ?subject geo:contains ?child .
        OPTIONAL { ?child geo:name ?name }
      }
    }
    ORDER BY ?name
    LIMIT 5
  }
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?name
`,
);

run(
  "OPTIONAL inside LATERAL RHS — leaf (no contains)",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child WHERE {
  VALUES ?subject { <${LONELY}> }
  LATERAL {
    SELECT ?subject ?child WHERE {
      OPTIONAL { ?subject geo:contains ?child }
    }
    ORDER BY ?child
    LIMIT 5
  }
}
`,
);

run(
  "mixed Görlitz + leaf, OPTIONAL inside LATERAL",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> <${LONELY}> }
  LATERAL {
    SELECT ?subject ?child WHERE {
      OPTIONAL {
        ?subject geo:contains ?child .
        OPTIONAL { ?child geo:name ?name }
      }
    }
    ORDER BY ?name
    LIMIT 5
  }
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?subject ?name
`,
);

run(
  "CONSTRUCT-like: type + required LATERAL",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  ?subject a geo:Place .
  LATERAL {
    SELECT ?subject ?child WHERE {
      ?subject geo:contains ?child .
      OPTIONAL { ?child geo:name ?name }
    }
    ORDER BY ?name
    LIMIT 5
  }
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?name
`,
);

console.log("\nDone.");
