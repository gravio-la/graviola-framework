import { describe, expect, test } from "bun:test";
import { clearGraph, dumpQuads, isEndpointReachable, loadQuads } from "./index";

const ENDPOINT = process.env.SPARQL_ENDPOINT ?? "http://localhost:7878";

const SAMPLE_NQUADS = [
  '<http://example.org/s> <http://example.org/p> "roundtrip" .',
  '<http://example.org/s2> <http://example.org/p> "sparql-tools" .',
].join("\n");

describe("sparql-tools round-trip", () => {
  test("load, dump, clear", async () => {
    const reachable = await isEndpointReachable(ENDPOINT);
    if (!reachable) {
      console.log(`Skipping round-trip test: ${ENDPOINT} is not reachable`);
      return;
    }

    await clearGraph({ endpoint: ENDPOINT });
    await loadQuads({ endpoint: ENDPOINT, nquads: SAMPLE_NQUADS });

    const dumped = await dumpQuads({ endpoint: ENDPOINT });
    expect(dumped).toContain("roundtrip");
    expect(dumped).toContain("sparql-tools");

    await clearGraph({ endpoint: ENDPOINT });
    const afterClear = await dumpQuads({ endpoint: ENDPOINT });
    expect(afterClear.trim()).toBe("");
  });
});
