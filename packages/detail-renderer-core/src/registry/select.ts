import maxBy from "lodash-es/maxBy";
import type { JsonSchema } from "@jsonforms/core";
import type { UISchemaElement } from "@jsonforms/core";
import type { DetailRendererRegistryEntry } from "../types";
import type { DetailTesterContext } from "../types";

const TESTER_NOT_APPLICABLE = -1;

export function selectEntry<
  T extends { tester: import("@jsonforms/core").RankedTester },
>(
  registry: T[],
  uischema: UISchemaElement,
  schema: JsonSchema,
  ctx: DetailTesterContext,
): T | null {
  const testerCtx = {
    rootSchema: ctx.rootSchema as JsonSchema,
    config: ctx,
  };

  const best = maxBy(registry, (entry) =>
    entry.tester(uischema as never, schema as never, testerCtx as never),
  );
  if (!best) return null;
  const rank = best.tester(
    uischema as never,
    schema as never,
    testerCtx as never,
  );
  return rank > TESTER_NOT_APPLICABLE ? best : null;
}
