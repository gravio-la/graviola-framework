import datasetFactory from "@rdfjs/dataset";
import type { BlankNode, DatasetCore, Quad } from "@rdfjs/types";
import { JsonLdParser } from "jsonld-streaming-parser";
import { DataFactory } from "rdf-data-factory";

/**
 * Blank node labels of a document only say which nodes are the same node. The
 * parser would hand them on verbatim and unchecked, so every label is replaced
 * by a generated one — as the JSON-LD to RDF algorithm prescribes. One factory
 * per document keeps the mapping consistent within it.
 */
class RelabelingDataFactory extends DataFactory<Quad> {
  private readonly relabeled = new Map<string, BlankNode>();

  override blankNode(label?: string): BlankNode {
    if (!label) return super.blankNode();
    let node = this.relabeled.get(label);
    if (!node) {
      node = super.blankNode();
      this.relabeled.set(label, node);
    }
    return node;
  }
}

export type Jsonld2DataSetOptions = {
  /**
   * `true` (default): an invalid IRI or language tag, or a key the context
   * does not map, fails the conversion. `false`: such values are left out, as
   * JSON-LD processing does by default — for documents from foreign sources.
   */
  strict?: boolean;
  /**
   * `false` (default): a `@context` given as a URL fails the conversion.
   * Loading it would make the caller's process request an address chosen by
   * whoever wrote the document, and let that document decide which predicates
   * its keys map to. `true`: remote contexts are fetched — for files a user
   * imports on purpose.
   */
  allowRemoteContexts?: boolean;
};

const refuseRemoteContexts = {
  load: async (url: string): Promise<never> => {
    throw new Error(`Remote JSON-LD context is not allowed: ${url}`);
  },
};

// The parser is the one place where strings become RDF terms: it never emits
// an invalid IRI or language tag, so nothing downstream (N3 writer, SPARQL
// updates) has to re-check them.
export const jsonld2DataSet: (
  jsonld: any,
  options?: Jsonld2DataSetOptions,
) => Promise<DatasetCore<Quad>> = (input: any, options) =>
  new Promise((resolve, reject) => {
    const ds = datasetFactory.dataset<Quad>();
    const fail = (e: unknown) =>
      reject(new Error("unable to parse the data", { cause: e }));
    try {
      const parser = new JsonLdParser({
        strictValues: options?.strict ?? true,
        ...(options?.allowRemoteContexts
          ? {}
          : { documentLoader: refuseRemoteContexts }),
        dataFactory: new RelabelingDataFactory(),
      });
      parser
        .on("data", (quad: Quad) => ds.add(quad))
        .on("error", fail)
        .on("end", () => resolve(ds));
      parser.end(JSON.stringify(input));
    } catch (e) {
      fail(e);
    }
  });
