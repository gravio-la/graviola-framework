#!/usr/bin/env bun
/**
 * sample-data CLI
 *
 *   bun run src/cli.ts list
 *   bun run src/cli.ts generate geo
 *   bun run src/cli.ts generate geo --limit 20 --refresh
 *   bun run src/cli.ts generate geo --offline
 */
import {
  boolean,
  command,
  flag,
  number,
  option,
  optional,
  positional,
  run,
  string,
  subcommands,
} from "cmd-ts";
import { loadDomains } from "./domains";
import { generateDomain } from "./pipeline";

const listCommand = command({
  name: "list",
  description: "List available sample-data domains",
  args: {},
  handler: async () => {
    const domains = await loadDomains();
    console.log("Available domains:\n");
    for (const domain of domains.values()) {
      console.log(`  ${domain.name}`);
      console.log(`    schema:  ${domain.baseIRI}`);
      console.log(
        `    seed:    ${domain.seed.typeName} via ${domain.seed.query}`,
      );
      console.log(`    output:  ${domain.output}`);
      console.log(`    dir:     ${domain.domainDir}`);
      console.log();
    }
  },
});

const generateCommand = command({
  name: "generate",
  description:
    "Run the three-step pipeline (SPARQL → entity fetch → map) and write Turtle",
  args: {
    domain: positional({
      type: string,
      displayName: "domain",
      description: "Domain name (see `list`)",
    }),
    refresh: flag({
      long: "refresh",
      short: "r",
      description: "Ignore cache and re-fetch from Wikidata",
      type: boolean,
      defaultValue: () => false,
    }),
    offline: flag({
      long: "offline",
      description: "Fail on cache miss (no network)",
      type: boolean,
      defaultValue: () => false,
    }),
    limit: option({
      long: "limit",
      short: "n",
      type: optional(number),
      description: "Override seed SELECT LIMIT",
    }),
  },
  handler: async ({ domain: domainName, refresh, offline, limit }) => {
    if (refresh && offline) {
      console.error("Cannot combine --refresh and --offline");
      process.exitCode = 1;
      return;
    }

    const domains = await loadDomains();
    const domain = domains.get(domainName);
    if (!domain) {
      console.error(
        `Unknown domain "${domainName}". Available: ${[...domains.keys()].join(", ")}`,
      );
      process.exitCode = 1;
      return;
    }

    console.log(`Generating sample data for domain "${domain.name}"`);
    console.log(`  dir: ${domain.domainDir}`);
    if (limit !== undefined) console.log(`  limit: ${limit}`);
    if (refresh) console.log(`  refresh: true`);
    if (offline) console.log(`  offline: true`);
    console.log();

    const result = await generateDomain(domain, {
      refresh,
      offline,
      limit,
    });

    console.log();
    console.log("Done.");
    console.log(`  seeds:   ${result.seedCount}`);
    console.log(
      `  types:   ${Object.entries(result.typeCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
    console.log(`  triples: ${result.tripleCount}`);
    console.log(`  output:  ${result.outputPath}`);
  },
});

const cli = subcommands({
  name: "sample-data",
  description:
    "Reproducible Wikidata → Turtle sample-data generator for Graviola demos",
  version: "0.1.0",
  cmds: {
    list: listCommand,
    generate: generateCommand,
  },
});

await run(cli, process.argv.slice(2));
