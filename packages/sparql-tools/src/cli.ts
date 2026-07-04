#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { clearGraph, dumpQuads, loadQuads } from "./index";

const DEFAULT_ENDPOINT = "http://localhost:7878";

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0];
  const endpoint =
    (typeof flags.endpoint === "string" ? flags.endpoint : undefined) ??
    DEFAULT_ENDPOINT;
  const graph = typeof flags.graph === "string" ? flags.graph : undefined;

  switch (command) {
    case "dump": {
      const data = await dumpQuads({ endpoint, graph });
      process.stdout.write(data);
      break;
    }
    case "load": {
      const file = typeof flags.file === "string" ? flags.file : undefined;
      const nquads = file ? readFileSync(file, "utf8") : await Bun.stdin.text();
      if (!nquads.trim()) {
        throw new Error("No N-Quads input (use --file or stdin)");
      }
      await loadQuads({ endpoint, nquads, graph });
      break;
    }
    case "clear": {
      await clearGraph({ endpoint, graph });
      break;
    }
    default:
      console.error(
        `Usage: sparql-tools db <dump|load|clear> [--endpoint URL] [--graph IRI] [--file PATH]`,
      );
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
