/**
 * Empirical LATERAL windowing verification against in-process Oxigraph.
 * Run from repo: bun apps/datastore-tests/scripts/verify-lateral.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "oxigraph";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ttlPath = join(
  __dirname,
  "../../sample-data/domains/geo/out/geo.ttl",
);
const ttl = readFileSync(ttlPath, "utf8");

const VOCAB = "http://ontologies.gra.one/samples/geo#";
const PARENT = "http://ontologies.gra.one/samples/geo/Place/Q6317"; // Landkreis Görlitz — 12 cities
const PARENT2 = "http://ontologies.gra.one/samples/geo/Place/Q1206"; // Sachsen-Anhalt — 15

const store = new Store();
store.load(ttl, {
  format: "text/turtle",
  base_iri: "http://ontologies.gra.one/samples/geo/",
});
console.log("store size:", store.size);

function run(label, query) {
  console.log(`\n=== ${label} ===`);
  try {
    const raw = store.query(query, {
      results_format: "application/sparql-results+json",
    });
    const parsed = JSON.parse(raw || "{}");
    const rows = (parsed.results?.bindings ?? []).map((b) => {
      const row = {};
      for (const [k, v] of Object.entries(b)) row[k] = v.value;
      return row;
    });
    console.log(`rows: ${rows.length}`);
    for (const r of rows.slice(0, 25)) console.log(JSON.stringify(r));
    return rows;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    return null;
  }
}

run(
  "baseline: all contains of Görlitz",
  `
PREFIX geo: <${VOCAB}>
SELECT ?child ?name WHERE {
  <${PARENT}> geo:contains ?child .
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?name
`,
);

run(
  "BROKEN: plain SUBSELECT LIMIT 5 (no LATERAL)",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  {
    SELECT ?child WHERE {
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

run(
  "LATERAL: subject projected, LIMIT 5",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
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

run(
  "LATERAL WITHOUT subject project",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  LATERAL {
    SELECT ?child WHERE {
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

run(
  "LATERAL: two parents, LIMIT 3 each",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> <${PARENT2}> }
  LATERAL {
    SELECT ?subject ?child WHERE {
      ?subject geo:contains ?child .
      OPTIONAL { ?child geo:name ?name }
    }
    ORDER BY ?name
    LIMIT 3
  }
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?subject ?name
`,
);

run(
  "OPTIONAL { LATERAL { ... } } (suspect empty LHS)",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  OPTIONAL {
    LATERAL {
      SELECT ?subject ?child WHERE {
        ?subject geo:contains ?child .
        OPTIONAL { ?child geo:name ?name }
      }
      ORDER BY ?name
      LIMIT 5
    }
  }
  OPTIONAL { ?child geo:name ?name }
}
ORDER BY ?name
`,
);

run(
  "LATERAL required (no outer OPTIONAL)",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
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

run(
  "Two-level LATERAL chain on Sachsen-Anhalt",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?mid ?midName ?child ?childName WHERE {
  VALUES ?subject { <${PARENT2}> }
  LATERAL {
    SELECT ?subject ?mid WHERE {
      ?subject geo:contains ?mid .
      OPTIONAL { ?mid geo:name ?midName }
    }
    ORDER BY ?midName
    LIMIT 2
  }
  OPTIONAL { ?mid geo:name ?midName }
  LATERAL {
    SELECT ?mid ?child WHERE {
      ?mid geo:contains ?child .
      OPTIONAL { ?child geo:name ?childName }
    }
    ORDER BY ?childName
    LIMIT 2
  }
  OPTIONAL { ?child geo:name ?childName }
}
ORDER BY ?midName ?childName
`,
);

run(
  "LATERAL inverse: ?child geo:partOf ?subject LIMIT 5",
  `
PREFIX geo: <${VOCAB}>
SELECT ?subject ?child ?name WHERE {
  VALUES ?subject { <${PARENT}> }
  LATERAL {
    SELECT ?subject ?child WHERE {
      ?child geo:partOf ?subject .
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
