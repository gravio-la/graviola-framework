import type { SparqlBuildOptions } from "@graviola/edb-core-types";
import type { InverseMap } from "@graviola/json-schema-utils";

/**
 * Single source of truth for SPARQL inverse maps at store init:
 * `queryBuildOptions.inverses` wins; otherwise {@link adbInverses} from AdbProvider.
 */
export function resolveStoreQueryBuildOptions(
  queryBuildOptions: SparqlBuildOptions | undefined,
  adbInverses: InverseMap | undefined,
): SparqlBuildOptions | undefined {
  if (queryBuildOptions?.inverses !== undefined) {
    return queryBuildOptions;
  }
  if (adbInverses === undefined) {
    return queryBuildOptions;
  }
  return {
    ...(queryBuildOptions ?? {}),
    inverses: adbInverses,
  } as SparqlBuildOptions;
}
