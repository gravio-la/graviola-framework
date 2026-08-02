/**
 * Sync apps/sample-data/domains/geo/out/geo.ttl → src/geo.turtle.generated.ts
 *
 * Run after regenerating geo sample data:
 *   bun run --filter @graviola/sample-data generate:geo
 *   bun run --filter @graviola/sample-data-geo sync
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const sourceTtl = join(
  packageRoot,
  "../../apps/sample-data/domains/geo/out/geo.ttl",
);
const outFile = join(packageRoot, "src/geo.turtle.generated.ts");

const turtle = readFileSync(sourceTtl, "utf8");
const escaped = turtle
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$/g, "\\$");

const banner = `/* eslint-disable */
/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: apps/sample-data/domains/geo/out/geo.ttl
 * Regenerate: bun run sync  (from packages/sample-data-geo)
 */
`;

const contents = `${banner}export const geoTurtle = \`${escaped}\`;\n`;

writeFileSync(outFile, contents, "utf8");
console.log(
  `Wrote ${outFile} (${turtle.length} chars, ${turtle.split("\n").length} lines)`,
);
