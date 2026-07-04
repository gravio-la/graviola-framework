import type { WalkerOptions } from "@graviola/edb-core-types";
import { traverseGraphExtractBySchema } from "@graviola/edb-graph-traversal";
import { bringDefinitionToTop, defs } from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import jsonld from "jsonld";
import { DataFactory, Parser, Store, type Quad } from "n3";
import type { StagedChangeSet, StagedEntity } from "./types";

const { namedNode } = DataFactory;

const RDF_TYPE = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");

export type RdfFileImportOptions = {
  schema: JSONSchema7;
  baseIRI: string;
  typeNameToTypeIRI: (typeName: string) => string;
  walkerOptions?: Partial<WalkerOptions>;
};

export type StageRdfIntoChangeSetOptions = RdfFileImportOptions & {
  changeSet: StagedChangeSet;
  sourceRef: string;
  content: string;
  timestamp?: string;
};

const extensionOf = (fileName: string): string =>
  fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";

export const parseRdfContentToStore = async (
  content: string,
  fileName: string,
): Promise<Store> => {
  const store = new Store();
  const ext = extensionOf(fileName);

  switch (ext) {
    case "ttl": {
      const parser = new Parser({ format: "text/turtle" });
      for (const quad of parser.parse(content)) {
        store.addQuad(quad);
      }
      break;
    }
    case "nt": {
      const parser = new Parser({ format: "N-Triples" });
      for (const quad of parser.parse(content)) {
        store.addQuad(quad);
      }
      break;
    }
    case "nq": {
      const parser = new Parser({ format: "N-Quads" });
      for (const quad of parser.parse(content)) {
        store.addQuad(quad);
      }
      break;
    }
    case "json":
    case "jsonld": {
      const quads = (await jsonld.toRDF(JSON.parse(content))) as Quad[];
      for (const quad of quads) {
        store.addQuad(quad as Quad);
      }
      break;
    }
    default:
      throw new Error(`Unsupported RDF file extension: .${ext || "(none)"}`);
  }

  return store;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const collectNestedTypedIRIs = (
  value: unknown,
  typedIRIs: Set<string>,
  selfIRI: string,
  found: Set<string>,
): void => {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) {
      collectNestedTypedIRIs(item, typedIRIs, selfIRI, found);
    }
    return;
  }
  if (!isObjectRecord(value)) return;

  const nestedIRI = value["@id"];
  if (
    typeof nestedIRI === "string" &&
    nestedIRI !== selfIRI &&
    typedIRIs.has(nestedIRI)
  ) {
    found.add(nestedIRI);
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      collectNestedTypedIRIs(nested, typedIRIs, selfIRI, found);
    }
  }
};

const resolveParentLinks = (
  documents: Map<string, Record<string, unknown>>,
  typedIRIs: Set<string>,
): Map<string, string> => {
  const parentOf = new Map<string, string>();

  for (const [entityIRI, document] of documents) {
    const nested = new Set<string>();
    collectNestedTypedIRIs(document, typedIRIs, entityIRI, nested);

    for (const childIRI of nested) {
      const existingParent = parentOf.get(childIRI);
      if (existingParent === undefined) {
        parentOf.set(childIRI, entityIRI);
        continue;
      }
      if (existingParent !== entityIRI) {
        parentOf.delete(childIRI);
      }
    }
  }

  return parentOf;
};

export const stageRdfIntoChangeSet = async (
  options: StageRdfIntoChangeSetOptions,
): Promise<StagedEntity[]> => {
  const {
    changeSet,
    content,
    sourceRef,
    schema,
    baseIRI,
    typeNameToTypeIRI,
    walkerOptions,
  } = options;
  const timestamp = options.timestamp ?? new Date().toISOString();

  const store = await parseRdfContentToStore(content, sourceRef);
  const typedEntities = new Map<string, string>();

  for (const typeName of Object.keys(defs(schema))) {
    const typeIRI = typeNameToTypeIRI(typeName);
    for (const quad of store.getQuads(
      null,
      RDF_TYPE,
      namedNode(typeIRI),
      null,
    )) {
      typedEntities.set(quad.subject.value, typeIRI);
    }
  }

  const documents = new Map<string, Record<string, unknown>>();
  for (const [entityIRI, typeIRI] of typedEntities) {
    const typeName = typeIRI.substring(baseIRI.length);
    const typeSchema = bringDefinitionToTop(schema, typeName) as JSONSchema7;
    const document = traverseGraphExtractBySchema(
      baseIRI,
      entityIRI,
      store,
      typeSchema,
      walkerOptions ?? {},
    );
    documents.set(
      entityIRI,
      (document as Record<string, unknown> | null | undefined) ?? {
        "@id": entityIRI,
        "@type": typeIRI,
      },
    );
  }

  const typedIRIs = new Set(typedEntities.keys());
  const parentOf = resolveParentLinks(documents, typedIRIs);
  const staged: StagedEntity[] = [];

  const stageOne = async (entityIRI: string, parentIRI: string | undefined) => {
    const typeIRI = typedEntities.get(entityIRI);
    const document = documents.get(entityIRI);
    if (!typeIRI || !document) return;

    const entity = await changeSet.stage({
      entityIRI,
      typeIRI,
      document,
      parentIRI,
      provenance: {
        method: "file-import",
        sourceRef,
        timestamp,
      },
      trace: {
        decision: "created",
        mappingPath: [],
      },
    });
    staged.push(entity);
  };

  const rootIRIs = [...typedIRIs].filter((iri) => !parentOf.has(iri));
  for (const rootIRI of rootIRIs) {
    await stageOne(rootIRI, undefined);
  }

  for (const [childIRI, parentIRI] of parentOf) {
    await stageOne(childIRI, parentIRI);
  }

  return staged;
};
