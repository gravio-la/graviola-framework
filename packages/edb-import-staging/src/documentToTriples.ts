import { DataFactory, type Quad } from "n3";

const { namedNode, literal, blankNode, quad, defaultGraph } = DataFactory;

const RDF_TYPE = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");

export type DocumentToTriplesOptions = {
  propertyToIRI?: (name: string) => string;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const literalFromValue = (value: unknown) => {
  if (typeof value === "boolean") {
    return literal(
      String(value),
      namedNode("http://www.w3.org/2001/XMLSchema#boolean"),
    );
  }
  if (typeof value === "number") {
    return literal(
      String(value),
      namedNode("http://www.w3.org/2001/XMLSchema#decimal"),
    );
  }
  return literal(String(value));
};

const objectTerm = (
  value: unknown,
  propertyToIRI: (name: string) => string,
  subjectPath: string,
  quads: Quad[],
):
  | ReturnType<typeof namedNode>
  | ReturnType<typeof blankNode>
  | ReturnType<typeof literal> => {
  if (value === null || value === undefined) {
    return literal("");
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return literalFromValue(value);
  }
  if (Array.isArray(value)) {
    throw new Error(
      `Arrays must be handled at property level, got ${subjectPath}`,
    );
  }
  if (!isObjectRecord(value)) {
    return literal(String(value));
  }
  if (typeof value["@id"] === "string") {
    return namedNode(value["@id"]);
  }
  const bnode = blankNode(`_:${subjectPath.replace(/[^a-zA-Z0-9]/g, "_")}`);
  documentNodeToTriples(bnode, value, propertyToIRI, subjectPath, quads);
  return bnode;
};

const documentNodeToTriples = (
  subject: ReturnType<typeof namedNode> | ReturnType<typeof blankNode>,
  document: Record<string, unknown>,
  propertyToIRI: (name: string) => string,
  pathPrefix: string,
  quads: Quad[],
): void => {
  if (typeof document["@type"] === "string") {
    quads.push(
      quad(subject, RDF_TYPE, namedNode(document["@type"]), defaultGraph()),
    );
  }

  for (const [key, value] of Object.entries(document)) {
    if (key === "@id" || key === "@type") continue;
    if (value === undefined) continue;

    const predicate = namedNode(propertyToIRI(key));
    const propertyPath = `${pathPrefix}.${key}`;

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const item = value[index];
        quads.push(
          quad(
            subject,
            predicate,
            objectTerm(item, propertyToIRI, `${propertyPath}[${index}]`, quads),
            defaultGraph(),
          ),
        );
      }
      continue;
    }

    quads.push(
      quad(
        subject,
        predicate,
        objectTerm(value, propertyToIRI, propertyPath, quads),
        defaultGraph(),
      ),
    );
  }
};

/** Convert a Graviola-shaped JSON-LD document to RDF quads in the default graph. */
export const documentToTriples = (
  document: Record<string, unknown>,
  options: DocumentToTriplesOptions = {},
): Quad[] => {
  const propertyToIRI = options.propertyToIRI ?? ((name: string) => name);
  const entityId = document["@id"];
  if (typeof entityId !== "string" || entityId.length === 0) {
    throw new Error("document must have a string @id");
  }

  const quads: Quad[] = [];
  const subject = namedNode(entityId);
  documentNodeToTriples(subject, document, propertyToIRI, entityId, quads);
  return quads;
};

/** Remove all quads with the given subject IRI from an N3 store. */
export const removeSubjectQuads = (
  store: import("n3").Store,
  subjectIRI: string,
): void => {
  const subject = namedNode(subjectIRI);
  for (const q of store.getQuads(subject, null, null, null)) {
    store.removeQuad(q);
  }
};
