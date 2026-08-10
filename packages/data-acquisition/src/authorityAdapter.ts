import type { AuthorityConfiguration } from "@graviola/edb-data-mapping";

import type { AcquisitionRuntime } from "./runtime";
import type { BindingScope, EntityByIriSource } from "./types";

export const toAuthorityConfiguration = (
  source: EntityByIriSource,
  runtime: AcquisitionRuntime,
): AuthorityConfiguration => runtime.toAuthorityConfiguration(source);

export const fromAuthorityConfiguration = (
  cfg: AuthorityConfiguration,
  id = `adapter/${cfg.authorityIRI}`,
): import("./types").AdapterSource => ({
  id,
  kind: "adapter",
  authorityIRI: cfg.authorityIRI,
  fetch: async (scope: BindingScope) => {
    const iri = String(scope.input.iri ?? scope.input.entityIRI ?? "");
    const doc = await cfg.getEntityByIRI(iri);
    return { items: [doc], raw: doc };
  },
});
