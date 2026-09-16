import { strategyFunctionMap } from "./mappingStrategies";

export type MappingStrategyKind = "primitive" | "date" | "entity" | "array";

export type MappingStrategyCatalogEntry = {
  id: string;
  kind: MappingStrategyKind;
  summary: string;
  options?: string;
  when: string;
};

/**
 * Human-facing catalog for every id in `strategyFunctionMap`.
 * Keep in lockstep: `mappingStrategyCatalog.test.ts` asserts the id sets match.
 */
export const mappingStrategyCatalog: MappingStrategyCatalogEntry[] = [
  {
    id: "takeFirst",
    kind: "primitive",
    summary: "First element of an array (or of several JSONPath hits).",
    when: "Source path yields an array but the target slot is a single value.",
  },
  {
    id: "concatenate",
    kind: "primitive",
    summary: "Join an array of strings.",
    options: 'options.separator (default "")',
    when: "Several string paths should become one label (first_name + last_name).",
  },
  {
    id: "withDotTemplate",
    kind: "primitive",
    summary: "Substitute {{value}} into a string template.",
    options: "options.template, options.single",
    when: "Build an IRI or formatted string from a raw id.",
  },
  {
    id: "split",
    kind: "primitive",
    summary:
      "Split a string, optionally mapping each part with a nested strategy.",
    options: "options.separator, options.mapping.strategy",
    when: "One source string encodes several values.",
  },
  {
    id: "constant",
    kind: "primitive",
    summary: "Ignore the source and write a fixed value.",
    options: "options.value",
    when: "Stamp a type flag or default that the source does not carry.",
  },
  {
    id: "exists",
    kind: "primitive",
    summary: "Boolean: whether the source value is present.",
    when: "Target is a boolean 'has X' slot.",
  },
  {
    id: "dateStringToISODate",
    kind: "date",
    summary: "Wikidata/GND/ISO/dotted date string → YYYY-MM-DD (or year-only).",
    when: "Target slot is an ISO date string (typical JSON Schema date).",
  },
  {
    id: "dateStringToSpecialInt",
    kind: "date",
    summary: "Date string → Graviola packed date integer.",
    when: "Target uses the special-int date encoding, not ISO strings.",
  },
  {
    id: "dateArrayToSpecialInt",
    kind: "date",
    summary: "Array of date parts → packed date integer.",
    when: "Source exposes day/month/year as separate fields (special-int target).",
  },
  {
    id: "dateRangeStringToSpecialInt",
    kind: "date",
    summary:
      "Parse a 'start-end' range string and take one bound as packed int.",
    options: "extractElement: start | end (via strategy options in call sites)",
    when: "Source is a single range string targeting a packed-int slot.",
  },
  {
    id: "arrayToAdbDate",
    kind: "date",
    summary:
      "[day, month, year] (with optional offset) → { dateValue, dateModifier }.",
    options: "options.offset",
    when: "Target is the structured ADB date object, not a string.",
  },
  {
    id: "append",
    kind: "array",
    summary: "Append values onto an existing target array.",
    options: "options.allowDuplicates, options.subFieldMapping.fromSelf",
    when: "Target is multivalued and this mapping should add, not replace.",
  },
  {
    id: "createEntityWithAuthoritativeLink",
    kind: "entity",
    summary:
      "Mint (or reuse) a nested named entity, link it via idAuthority/sameAs, optionally fetch the authority record.",
    options:
      "options.single, options.typeIRI (required — typeName is ignored), options.mainProperty.offset, options.authorityFields[{offset, authorityLinkPrefix, authorityIRI}]",
    when:
      "Target slot range is another *named* class (Organization, Parliament, Place, Person). " +
      "Prefer this over stuffing a label into party.name. Use one JSONPath that yields [label, id] " +
      "(e.g. $.party['label','id']); mainProperty.offset 0 is the label, authorityFields.offset is the id. " +
      "The nested class needs its own mapping (or nestedYaml in try_mapping) so the fetched authority record can be mapped.",
  },
  {
    id: "createEntity",
    kind: "entity",
    summary:
      "Create a nested entity and recurse with subFieldMapping (fromSelf / fromEntity / mapping id).",
    options: "options.typeName, options.single, options.subFieldMapping",
    when: "Need nested mappings into the child without an authority id (or to compose further mappings).",
  },
  {
    id: "createEntityFromString",
    kind: "entity",
    summary:
      "Treat a string as a new entity of the given type (label-only, no authority id).",
    options: "options.typeName / typeIRI",
    when: "Source is a bare label and the target is a named class, with no id to reconcile on.",
  },
  {
    id: "createEntityWithReificationFromString",
    kind: "entity",
    summary:
      "Like createEntityFromString but wraps the value in a reified statement node.",
    when: "The model's fact encoding needs a statement wrapper around a string-derived entity.",
  },
];

export function mappingStrategyIds(): string[] {
  return Object.keys(strategyFunctionMap).sort();
}
