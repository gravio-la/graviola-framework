import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DataFactory, Writer, type Quad } from "n3";
import { documentToTriples } from "@graviola/edb-import-staging";
import type { StagedEntity } from "@graviola/edb-import-staging";

const { namedNode } = DataFactory;

export type WriteTurtleOptions = {
  entities: StagedEntity[];
  outputPath: string;
  baseIRI: string;
  propertyToIRI: (name: string) => string;
  prefixes?: Record<string, string>;
};

const quadSortKey = (q: Quad): string =>
  [
    q.subject.value,
    q.predicate.value,
    q.object.termType,
    q.object.value,
    "language" in q.object ? (q.object.language ?? "") : "",
    "datatype" in q.object ? (q.object.datatype?.value ?? "") : "",
  ].join("\t");

/**
 * Serialize staged (already-canonicalized) entities to deterministic Turtle.
 * Quads are sorted; prefix map is fixed; blank-node ids from N3 Writer are
 * still non-deterministic for nested objects — we avoid blank nodes by
 * keeping only named entities (sameAs is a URI string).
 */
export const writeTurtle = async (
  options: WriteTurtleOptions,
): Promise<{ tripleCount: number; turtle: string }> => {
  const { entities, outputPath, baseIRI, propertyToIRI } = options;

  // Sort entities by canonical IRI for stable document order
  const sorted = [...entities].sort((a, b) =>
    a.entityIRI.localeCompare(b.entityIRI),
  );

  const quads: Quad[] = [];
  for (const entity of sorted) {
    quads.push(
      ...documentToTriples(entity.document, {
        propertyToIRI: (name) => {
          if (name === "sameAs") {
            return "http://www.w3.org/2002/07/owl#sameAs";
          }
          return propertyToIRI(name);
        },
      }),
    );
  }

  // sameAs values are Wikidata IRIs stored as strings — documentToTriples
  // literalizes plain strings. Rewrite sameAs objects to named nodes.
  const OWL_SAME_AS = namedNode("http://www.w3.org/2002/07/owl#sameAs");
  const fixedQuads = quads.map((q) => {
    if (
      q.predicate.equals(OWL_SAME_AS) &&
      q.object.termType === "Literal" &&
      q.object.value.startsWith("http")
    ) {
      return DataFactory.quad(
        q.subject,
        q.predicate,
        namedNode(q.object.value),
        q.graph,
      );
    }
    return q;
  });

  fixedQuads.sort((a, b) => quadSortKey(a).localeCompare(quadSortKey(b)));

  const prefixes = options.prefixes ?? {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    owl: "http://www.w3.org/2002/07/owl#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    geo: baseIRI,
    wd: "http://www.wikidata.org/entity/",
  };

  const writer = new Writer({ format: "Turtle", prefixes });
  writer.addQuads(fixedQuads);

  const turtle: string = await new Promise((resolve, reject) => {
    writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

  // Normalize trailing whitespace for stable diffs
  const normalized = `${turtle.trimEnd()}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, normalized, "utf8");

  return { tripleCount: fixedQuads.length, turtle: normalized };
};
