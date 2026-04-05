import { AsyncOxigraph, LoadPayload } from "@graviola/async-oxigraph";
import { RDFMimetype } from "@graviola/async-oxigraph";
import df from "@rdfjs/data-model";
import { Store } from "oxigraph/web";

import { isAsyncOxigraph } from "./isAsyncOxigraph";

type OneOrMany<T> = T | T[];
export type LoadableData = OneOrMany<LoadPayload | string>;

const processLoadableData = <T>(
  data: LoadableData,
  callback: (data: LoadPayload) => Promise<T>,
): Promise<OneOrMany<T>> => {
  if (Array.isArray(data)) {
    return Promise.all(
      data.map((d) => {
        if (typeof d === "string") {
          return callback({
            triples: d,
            mimetype: RDFMimetype.TURTLE,
          });
        }
        return callback(d);
      }),
    );
  }
  if (typeof data === "string") {
    const loadPayload: LoadPayload = {
      triples: data,
      mimetype: RDFMimetype.TURTLE,
    };
    return callback(loadPayload);
  }
  return callback(data);
};

export const bulkLoader = async (
  store: Store | AsyncOxigraph,
  data: LoadableData,
): Promise<any> => {
  return processLoadableData(data, async (data) => {
    if (isAsyncOxigraph(store)) {
      console.log("loading async");
      return await store.load(
        data.triples,
        data.mimetype,
        data.baseURI,
        data.graphURI,
      );
    } else {
      console.log("loading sync");
      return store.load(data.triples, {
        format: data.mimetype,
        base_iri: data.baseURI,
        to_graph_name: data.graphURI ? df.namedNode(data.graphURI) : undefined,
      });
    }
  });
};
