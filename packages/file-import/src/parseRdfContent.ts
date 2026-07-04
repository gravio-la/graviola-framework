import { Parser, Store, type Quad } from "n3";
import jsonld from "jsonld";

const extensionOf = (fileName: string): string =>
  fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";

/** Parse RDF string content into an N3 store (browser-safe; no Node fs). */
export async function parseRdfContentToStore(
  content: string,
  fileName: string,
): Promise<Store> {
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
}
