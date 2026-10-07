import { JSONSchema7 } from "json-schema";
import {
  DSProcessingOptions,
  processAllDocumentsFromDataset,
} from "@graviola/edb-maintenance-utils";
import mime from "mime-types";
import { DatasetCore } from "@rdfjs/types";
import datasetFactory from "@rdfjs/dataset";
import N3 from "n3";
import * as fs from "fs";
import { jsonld2DataSet } from "@graviola/jsonld-utils";

export const processEachDocumentFromFile = async (
  file: string,
  schema: JSONSchema7,
  onDocument: (
    entityIRI: string,
    typeIRI: string,
    document: any,
  ) => Promise<void>,
  options: DSProcessingOptions,
) => {
  const mimeType = mime.lookup(file);
  let ds: DatasetCore | null = null;
  switch (mimeType) {
    case "text/turtle":
    case "application/n-triples":
      const reader = new N3.Parser();
      ds = datasetFactory.dataset(reader.parse(fs.readFileSync(file, "utf-8")));
      break;
    case "application/json":
      ds = await jsonld2DataSet(JSON.parse(fs.readFileSync(file, "utf-8")), {
        strict: false,
        allowRemoteContexts: true,
      });
      break;
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
  if (ds === null) {
    throw new Error("Unable to parse the data");
  }
  return await processAllDocumentsFromDataset(ds, schema, onDocument, options);
};
