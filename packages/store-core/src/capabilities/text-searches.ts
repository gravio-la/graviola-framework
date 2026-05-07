/**
 * Narrow FTS primitive — IRI in, scored IRIs out. Federator combines with RDF using annotations.
 */
export type TextSearchHit = {
  iri: string;
  score: number;
};

export interface TextSearches {
  searchText(
    typeName: string,
    text: string,
    options?: {
      fields?: string[];
      restrictTo?: string[];
      limit?: number;
    },
  ): Promise<TextSearchHit[]>;
}
