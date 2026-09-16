import { getViaSourcePath } from "@graviola/edb-data-mapping";

import type { ExampleQuery, ExampleResult } from "./types";
import type { SecondarySourceRuntime } from "./runtime";

function assertExample(
  example: ExampleQuery,
  sample: unknown,
  items?: unknown[],
): ExampleResult["assertions"] {
  const assertions: ExampleResult["assertions"] = [];
  const expect = example.expect;
  if (!expect) {
    assertions.push({ pass: true, message: "No expectations defined" });
    return assertions;
  }

  if (expect.minItems != null) {
    const count = Array.isArray(items) ? items.length : items ? 1 : 0;
    assertions.push({
      pass: count >= expect.minItems,
      message: `minItems: expected >= ${expect.minItems}, got ${count}`,
    });
  }

  if (expect.containsId) {
    const haystack = JSON.stringify(items ?? sample ?? "");
    assertions.push({
      pass: haystack.includes(expect.containsId),
      message: `containsId: ${expect.containsId}`,
    });
  }

  if (expect.jsonPathExists?.length) {
    const doc = sample ?? (Array.isArray(items) ? items[0] : undefined);
    for (const path of expect.jsonPathExists) {
      const v = getViaSourcePath(doc, path);
      assertions.push({
        pass: v != null && v !== "",
        message: `jsonPathExists: ${path}`,
      });
    }
  }

  return assertions;
}

export async function runExampleQuery(
  runtime: SecondarySourceRuntime,
  example: ExampleQuery,
): Promise<ExampleResult> {
  const start = Date.now();
  try {
    if (example.operation === "search") {
      const q = String(example.input.q ?? example.input.query ?? "");
      const targetType = example.input.targetType as string | undefined;
      const limit = example.input.limit as number | undefined;
      const { candidates, provenance } = await runtime.search(q, {
        targetType,
        limit,
      });
      const assertions = assertExample(example, candidates[0]?.raw, candidates);
      return {
        ok: assertions.every((a) => a.pass),
        assertions,
        durationMs: Date.now() - start,
        provenance,
        sample: candidates,
      };
    }

    if (example.operation === "getEntity") {
      const iri = String(example.input.iri ?? "");
      const { document, provenance } = await runtime.getEntity(iri);
      const assertions = assertExample(example, document);
      return {
        ok: assertions.every((a) => a.pass),
        assertions,
        durationMs: Date.now() - start,
        provenance,
        sample: document,
      };
    }

    return {
      ok: false,
      assertions: [
        { pass: false, message: `Unknown operation: ${example.operation}` },
      ],
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      assertions: [
        {
          pass: false,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
      durationMs: Date.now() - start,
    };
  }
}
