/**
 * Sync wikidata-geo-data-mapper geo.ttl → src/geo.turtle.generated.ts
 *
 * Run after regenerating geo sample data in the extracted repo:
 *   cd apps/sample-data && bun run generate:geo
 *   bun run --filter @graviola/sample-data-geo sync
 *
 * Override source path: GRAVIOLA_GEO_TTL=/path/to/geo.ttl
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");

function resolveSourceTtl(): string {
  const fromEnv = process.env.GRAVIOLA_GEO_TTL;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`GRAVIOLA_GEO_TTL not found: ${fromEnv}`);
    }
    return fromEnv;
  }

  const candidates = [
    join(packageRoot, "../../apps/sample-data/domains/geo/out/geo.ttl"),
    join(
      packageRoot,
      "../../../samples/wikidata-geo-data-mapper/domains/geo/out/geo.ttl",
    ),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "geo.ttl not found. Clone wikidata-geo-data-mapper as apps/sample-data or set GRAVIOLA_GEO_TTL.",
  );
}

const sourceTtl = resolveSourceTtl();
const outFile = join(packageRoot, "src/geo.turtle.generated.ts");

const turtle = readFileSync(sourceTtl, "utf8");
const escaped = turtle
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$/g, "\\$");

const banner = `/* eslint-disable */
/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: wikidata-geo-data-mapper domains/geo/out/geo.ttl
 * Regenerate: bun run sync  (from packages/sample-data-geo)
 */
`;

const contents = `${banner}export const geoTurtle = \`${escaped}\`;\n`;

writeFileSync(outFile, contents, "utf8");
console.log(
  `Wrote ${outFile} (${turtle.length} chars, ${turtle.split("\n").length} lines)`,
);
