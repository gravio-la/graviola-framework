/**
 * Geo sample domain — the one sheet.
 *
 * Open this file to see how a domain is wired:
 *   1. schema / primaryFields — from `@graviola/sample-data-geo`
 *   2. mappings.ts            — declarative Wikidata → schema mappings
 *   3. select.rq              — Wikidata SPARQL seed query
 *
 * Run:  bun run generate:geo
 *       bun run src/cli.ts generate geo --limit 20
 *       bun run src/cli.ts generate geo --offline
 *
 * After regenerating Turtle, sync the Storybook/test fixture package:
 *   bun run --filter @graviola/sample-data-geo sync
 */
import {
  BASE_IRI,
  INSTANCE_BASE,
  primaryFields,
  schema,
} from "@graviola/sample-data-geo";
import { defineSampleDomain } from "../../src/pipeline/types";
import { geoWikidataMappings, geoWikidataTypeMap } from "./mappings";

export default defineSampleDomain({
  name: "geo",
  baseIRI: BASE_IRI,
  instanceBase: INSTANCE_BASE,
  domainDir: import.meta.dir,
  schema,
  primaryFields,
  mappings: geoWikidataMappings,
  sameAsTypeMap: geoWikidataTypeMap,
  seed: {
    typeName: "City",
    query: "select.rq",
    entityVar: "city",
    limit: 150,
  },
  output: "out/geo.ttl",
});
