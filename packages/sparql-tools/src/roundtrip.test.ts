import { describe, expect, test } from "bun:test";
import { clearGraph, dumpQuads, loadQuads } from "./index";

const ENDPOINT = process.env.SPARQL_TOOLS_TEST_ENDPOINT?.trim();
const integrationTest = ENDPOINT ? test : test.skip;

const SAMPLE_NQUADS = [
  '<http://example.org/s> <http://example.org/p> "roundtrip" .',
  '<http://example.org/s2> <http://example.org/p> "sparql-tools" .',
].join("\n");

describe("sparql-tools round-trip", () => {
  integrationTest(
    "load, dump, clear (set SPARQL_TOOLS_TEST_ENDPOINT to run against a SPARQL server)",
    async () => {
      const endpoint = ENDPOINT!;

      await clearGraph({ endpoint });
      await loadQuads({ endpoint, nquads: SAMPLE_NQUADS });

      const dumped = await dumpQuads({ endpoint });
      expect(dumped).toContain("roundtrip");
      expect(dumped).toContain("sparql-tools");

      await clearGraph({ endpoint });
      const afterClear = await dumpQuads({ endpoint });
      expect(afterClear.trim()).toBe("");
    },
  );
});
