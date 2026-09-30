type LiteralMappingTarget = {
  kind?: "literal";
  single?: boolean;
  optional?: boolean;
  predicateURI: string;
  type:
    | "xsd:string"
    | "xsd:integer"
    | "xsd:float"
    | "xsd:double"
    | "xsd:boolean"
    | "xsd:date"
    | "xsd:dateTime"
    | "xsd:time";
};

type ObjectMappingTarget = {
  kind: "object";
  single?: boolean;
  optional?: boolean;
  predicateURI: string;
  type: "NamedNode" | "BlankNode";
  includeLabel?: boolean;
  includeDescription?: boolean;
};

/** Field mapping descriptor for SPARQL SELECT projections (legacy API surface). */
export type FieldMapping = {
  [k: string]: LiteralMappingTarget | ObjectMappingTarget;
};
