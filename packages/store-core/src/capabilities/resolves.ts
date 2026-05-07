export interface Resolves {
  /** RDF classes / OWL types for an entity IRI */
  resolveTypes(entityIRI: string): Promise<string[]>;
}
